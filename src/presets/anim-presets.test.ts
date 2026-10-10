import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "../components/index.ts";
import type { AnimPreset } from "../model/anim-preset.ts";
import { defaultScene, type Element, type Scene } from "../model/model.ts";
import { parseScene } from "../model/schema.ts";
import type { Keyframe } from "../model/track.ts";
import {
  applyPreset,
  applyToSelection,
  capturePreset,
  expandAnimPresets,
  namesAnimPreset,
  staggerStarts,
} from "./anim-presets.ts";
import { saveAnimPreset } from "./store.ts";

const kf = (t: number, value: number | string): Keyframe => ({
  t,
  value,
  easing: "auto",
});

const pairs = (keys: readonly Keyframe[] | undefined) =>
  keys?.map((k) => [k.t, k.value]);

const animOf = (el: Element) => (el as ReturnType<typeof rect>).anim;

/** A rect at x 100 that fades in at 1.5 s and moves right 50 px from 1 s to 2 s. */
function rect() {
  const r = createElement("rect");
  r.name = "caja";
  r.x = 100;
  r.y = 40;
  r.anim.in = { ...r.anim.in, kind: "fade", delay: 1.5 };
  r.tracks = {
    x: [kf(1, 100), kf(2, 150)],
    "fill.color": [kf(1, "#ff0000")],
  };
  return r;
}

const sceneWith = (...elements: Element[]): Scene => ({
  ...defaultScene(),
  duration: 4,
  elements,
});

describe("capture", () => {
  it("counts times from the first moment and stores positions as offsets", () => {
    const p = capturePreset(rect());
    expect(pairs(p.tracks?.x)).toEqual([
      [0, 0],
      [1, 50],
    ]);
    expect(p.anim?.in?.delay).toBe(0.5);
    // a color is not a position: kept absolute
    expect(pairs(p.tracks?.["fill.color"])).toEqual([[0, "#ff0000"]]);
  });

  it("leaves out slots that do nothing", () => {
    const p = capturePreset(rect());
    expect(Object.keys(p.anim ?? {})).toEqual(["in"]);
  });
});

describe("apply", () => {
  it("round trips onto another kind, at a chosen start and position", () => {
    const text = { ...createElement("text"), x: 10 };
    const { el, skipped } = applyPreset(text, capturePreset(rect()), 2);
    expect(pairs(el.tracks?.x)).toEqual([
      [2, 10],
      [3, 60],
    ]);
    expect(animOf(el).in.delay).toBe(2.5);
    expect(animOf(el).in.kind).toBe("fade");
    // text has `color`, not `fill`
    expect(skipped).toEqual(["fill.color"]);
  });

  it("adds offsets only on relative fields", () => {
    const p: AnimPreset = {
      name: "p",
      tracks: { y: [kf(0, 5)], w: [kf(0, 50)], "@rotate": [kf(0, 30)] },
    };
    const { el } = applyPreset(rect(), p, 0);
    expect(pairs(el.tracks?.y)).toEqual([[0, 45]]);
    expect(pairs(el.tracks?.w)).toEqual([[0, 50]]);
    expect(pairs(el.tracks?.["@rotate"])).toEqual([[0, 30]]);
  });

  it("replaces only the slots and tracks it has", () => {
    const target = rect();
    target.anim.loop = { ...target.anim.loop, kind: "float" };
    const p: AnimPreset = {
      name: "p",
      anim: { out: { ...target.anim.out, kind: "fade", delay: 1 } },
      tracks: { y: [kf(0, 0)] },
    };
    const { el } = applyPreset(target, p, 0);
    expect(animOf(el).in.kind).toBe("fade");
    expect(animOf(el).loop.kind).toBe("float");
    expect(animOf(el).out.kind).toBe("fade");
    expect(pairs(el.tracks?.x)).toEqual(pairs(target.tracks?.x));
    expect(el.tracks?.y).toBeDefined();
  });

  it("skips missing paths, mismatched types and slots the kind cannot play", () => {
    const p: AnimPreset = {
      name: "p",
      anim: { in: { ...rect().anim.in, kind: "pop" } },
      tracks: {
        nope: [kf(0, 1)],
        "fill.color": [kf(0, 3)],
        x: [kf(0, "#fff")],
      },
    };
    const { el, skipped } = applyPreset(createElement("line"), p, 0);
    expect(skipped.sort()).toEqual(["anim.in", "fill.color", "nope", "x"]);
    expect(el.tracks).toBeUndefined();
  });

  it("shifts the delay of a loop that ends, not of one that repeats forever", () => {
    const r = rect();
    r.anim.loop = { ...r.anim.loop, kind: "float", delay: 2, iterations: 2 };
    expect(animOf(applyPreset(r, capturePreset(r), 1).el).loop.delay).toBe(2);
    r.anim.loop.iterations = "infinite";
    expect(capturePreset(r).anim?.loop?.delay).toBe(2);
  });

  it("copies: editing the preset later leaves the element alone", () => {
    const p = { name: "p", ...capturePreset(rect()) };
    const { el } = applyPreset(createElement("rect"), p, 0);
    (p.anim?.in as { kind: string }).kind = "pop";
    (p.tracks?.x?.[0] as Keyframe).value = 999;
    expect(animOf(el).in.kind).toBe("fade");
    expect(el.tracks?.x?.[0]?.value).not.toBe(999);
    expect(el.animPreset).toEqual({ name: "p", start: 0 });
  });
});

describe("apply to a selection", () => {
  it("gives starts in selection order", () => {
    expect(staggerStarts(3, 1, 0.5)).toEqual([1, 1.5, 2]);
  });

  it("staggers elements in selection order and cuts keyframes past the duration", () => {
    const a = { ...createElement("rect"), id: "a", name: "A" };
    const b = { ...createElement("rect"), id: "b", name: "B" };
    const p: AnimPreset = {
      name: "p",
      tracks: { w: [kf(0, 10), kf(2, 20)] },
    };
    const r = applyToSelection(sceneWith(a, b), ["b", "a"], p, 1, 2);
    const [ra, rb] = r.scene.elements as [Element, Element];
    expect(pairs(rb.tracks?.w)).toEqual([
      [1, 10],
      [3, 20],
    ]);
    expect(pairs(ra.tracks?.w)).toEqual([[3, 10]]);
    expect(r.skipped).toEqual(["A: w (después de 4s)"]);
  });
});

describe("scenes naming a preset", () => {
  const library: AnimPreset[] = [{ name: "entrada", ...capturePreset(rect()) }];

  it("accept a name or { name, start } and expand it on load", () => {
    const plain = { ...createElement("rect"), x: 0, animPreset: "entrada" };
    const parsed = parseScene(sceneWith(plain as unknown as Element));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const { scene, notices } = expandAnimPresets(parsed.value, library);
    expect(notices).toEqual([]);
    expect(pairs(scene.elements[0]?.tracks?.x)).toEqual([
      [0, 0],
      [1, 50],
    ]);
  });

  it("keep an element's own animation over the preset it names", () => {
    const own = { ...rect(), animPreset: { name: "entrada", start: 3 } };
    const { scene } = expandAnimPresets(sceneWith(own), library);
    expect(scene.elements[0]).toBe(own);
  });

  it("expand inside groups", () => {
    const child = {
      ...createElement("rect"),
      x: 0,
      animPreset: { name: "entrada", start: 0 },
    };
    const group = { ...createElement("group"), children: [child] };
    const { scene } = expandAnimPresets(sceneWith(group), library);
    expect(namesAnimPreset([group])).toBe(true);
    const [out] = (scene.elements[0] as typeof group).children;
    expect(pairs(out?.tracks?.x)).toEqual([
      [0, 0],
      [1, 50],
    ]);
  });

  it("load with an unknown name, with a notice", () => {
    const el = {
      ...createElement("rect"),
      animPreset: { name: "nada", start: 0 },
    };
    const { scene, notices } = expandAnimPresets(sceneWith(el), library);
    expect(scene.elements[0]).toEqual(el);
    expect(notices).toHaveLength(1);
  });
});

describe("saving", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("writes nothing for an invalid preset", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(
      saveAnimPreset({ name: "", tracks: { x: "no" } }, "malo"),
    ).rejects.toThrow("no es una animación válida");
    expect(fetch).not.toHaveBeenCalled();
  });
});
