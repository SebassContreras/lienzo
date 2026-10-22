import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { trackPaths } from "../components/descriptor.ts";
import { descriptorOf } from "../components/index.ts";
import { defaultRect, defaultScene, type Element } from "../model/model.ts";
import { parseScene } from "../model/schema.ts";
import type { Keyframe } from "../model/track.ts";
import { animate } from "./animate.ts";
import {
  applyTracks,
  commitAt,
  movedKeyframe,
  toggleTrack,
  valueAt,
  valueKind,
  withKeyframe,
  withoutKeyframe,
  writeAt,
} from "./tracks.ts";

const kf = (t: number, value: number | string, easing = "auto"): Keyframe =>
  ({ t, value, easing }) as Keyframe;

const rect = (tracks?: Element["tracks"]) => {
  const r = defaultRect();
  r.x = 100;
  if (tracks) r.tracks = tracks;
  return r;
};

const scene = defaultScene();

describe("track values", () => {
  const keys = [kf(1, 0), kf(3, 100)];

  it("hold before the first keyframe and after the last", () => {
    expect(valueAt(keys, 0, "number")).toBe(0);
    expect(valueAt(keys, 5, "number")).toBe(100);
    expect(valueAt([], 1, "number")).toBeUndefined();
  });

  it("blend numbers through the easing of the keyframe a segment starts at", () => {
    expect(valueAt(keys, 2, "number")).toBeCloseTo(50, 9);
    const eased = [kf(1, 0, "quad-in"), kf(3, 100)];
    expect(valueAt(eased, 2, "number")).toBeCloseTo(25, 9);
    // the last keyframe's easing shapes nothing
    const tail = [kf(1, 0), kf(3, 100, "quad-in")];
    expect(valueAt(tail, 2, "number")).toBeCloseTo(50, 9);
  });

  it("mix colors in RGB", () => {
    const c = [kf(0, "#000000"), kf(2, "#ff8000")];
    expect(valueAt(c, 1, "color")).toBe("#804000");
    expect(valueAt(c, 3, "color")).toBe("#ff8000");
  });

  it("step whole numbers at the next keyframe", () => {
    const n = [kf(0, 1), kf(2, 5)];
    expect(valueAt(n, 1.99, "int")).toBe(1);
    expect(valueAt(n, 2, "int")).toBe(5);
  });

  it("know each path's kind from the descriptor", () => {
    expect(valueKind("rect", "x")).toBe("number");
    expect(valueKind("rect", "fill.color")).toBe("color");
    expect(valueKind("particles", "count")).toBe("int");
    expect(valueKind("rect", "@rotate")).toBe("number");
  });

  it("offer whole-number fields and both channels as track paths", () => {
    const paths = trackPaths(descriptorOf("particles"));
    expect(paths).toContain("count");
    expect(paths).toContain("@rotate");
    expect(paths).toContain("@scale");
  });
});

describe("keyframe edits", () => {
  it("keep keyframes in time order and replace one at the same moment", () => {
    const keys = withKeyframe(
      [kf(2, 1), kf(0, 0)].sort((a, b) => a.t - b.t),
      kf(1, 9),
    );
    expect(keys.map((k) => k.t)).toEqual([0, 1, 2]);
    expect(withKeyframe(keys, kf(1.001, 5)).map((k) => k.value)).toEqual([
      0, 5, 1,
    ]);
  });

  it("move and delete keyframes", () => {
    const keys = [kf(0, 0), kf(1, 1), kf(2, 2)];
    expect(movedKeyframe(keys, 0, 1.5).map((k) => k.t)).toEqual([1, 1.5, 2]);
    // moved onto another keyframe, it replaces it
    expect(movedKeyframe(keys, 0, 2).map((k) => k.value)).toEqual([1, 0]);
    expect(withoutKeyframe(keys, 1).map((k) => k.t)).toEqual([0, 2]);
  });

  it("write the field when it has no track, else the keyframe at the playhead", () => {
    const set = (d: Element, v: unknown) => {
      (d as { x: number }).x = v as number;
    };
    const plain = rect();
    writeAt(plain, "x", 300, 1, set);
    expect(plain.x).toBe(300);
    expect(plain.tracks).toBeUndefined();

    const keyed = rect({ x: [kf(0, 0, "quad-in"), kf(2, 200)] });
    writeAt(keyed, "x", 50, 0, set);
    writeAt(keyed, "x", 120, 1, set);
    expect(keyed.x).toBe(100);
    expect(keyed.tracks?.x).toEqual([
      kf(0, 50, "quad-in"),
      kf(1, 120),
      kf(2, 200),
    ]);
  });

  it("always keyframe a channel, which has no field", () => {
    const r = rect();
    writeAt(r, "@rotate", 30, 1, () => {
      throw new Error("a channel has no field");
    });
    expect(r.tracks?.["@rotate"]).toEqual([kf(1, 30)]);
  });

  it("start a track from the current value and remove it leaving the value shown", () => {
    const r = rect();
    toggleTrack(r, "x", 1);
    expect(r.tracks?.x).toEqual([kf(1, 100)]);
    r.tracks = { x: [kf(0, 0), kf(2, 200)] };
    toggleTrack(r, "x", 1);
    expect(r.tracks).toEqual({});
    expect(r.x).toBeCloseTo(100, 9);
  });

  it("turn a stage drag of a keyframed field into a keyframe", () => {
    const r = rect({ x: [kf(0, 0), kf(2, 200)] });
    const dragged = { ...applyTracks(r, 1).el, x: 150, y: 40 };
    const out = commitAt(r, dragged, 1) as typeof r;
    expect(out.x).toBe(100);
    expect(out.y).toBe(40);
    expect(out.tracks?.x?.map((k) => [k.t, k.value])).toEqual([
      [0, 0],
      [1, 150],
      [2, 200],
    ]);
    // an untouched tracked field gains no keyframe
    expect(commitAt(r, { ...applyTracks(r, 1).el, y: 5 }, 1).tracks).toBe(
      r.tracks,
    );
  });
});

describe("animate with tracks", () => {
  it("sets fields, even off the canvas, then the preset animation applies on top", () => {
    const r = rect({
      x: [kf(0, -500), kf(2, 2000)],
      "fill.color": [kf(0, "#000000")],
    });
    r.anim.loop = { ...r.anim.loop, kind: "pulse", amount: 20 };
    const now = animate(r, 0, scene);
    expect(now.el.x).toBe(-500);
    expect(now.el.fill.color).toBe("#000000");
    expect(animate(r, 2, scene).el.x).toBe(2000);
    // the loop still runs on the keyframed element
    expect(animate(r, scene.duration / 2, scene).transform.scale).toBeCloseTo(
      1.2,
      9,
    );
    // the element itself is left as it was
    expect(r.x).toBe(100);
  });

  it("adds the rotation and scale channels to the transform", () => {
    const r = rect({ "@rotate": [kf(0, 0), kf(2, 90)], "@scale": [kf(0, 2)] });
    r.anim.in = {
      ...r.anim.in,
      kind: "zoom",
      delay: 0,
      duration: 2,
      easing: "linear",
    };
    const s = animate(r, 1, scene).transform;
    expect(s.rotate).toBeCloseTo(45, 9);
    expect(s.scale).toBeCloseTo(2 * (0.3 + 0.7 * 0.5), 9);
  });

  it("leaves elements without tracks exactly as before", () => {
    const r = rect();
    expect(animate(r, 1, scene).el).toBe(r);
  });
});

describe("scenes", () => {
  it("written before 015 still read, with no tracks", () => {
    const old = { ...scene, elements: [{ ...rect() }] };
    delete (old.elements[0] as { tracks?: unknown }).tracks;
    expect(parseScene(old).ok).toBe(true);
  });

  it("reject a broken track", () => {
    const bad = {
      ...scene,
      elements: [rect({ x: [{ t: -1, value: 1, easing: "auto" }] })],
    };
    expect(parseScene(bad).ok).toBe(false);
  });

  it("the keyframes example is valid: the arrow enters from outside and each square stays blue", () => {
    const file = new URL(
      "../test/fixtures/ejemplo-keyframes.json",
      import.meta.url,
    );
    const parsed = parseScene(JSON.parse(readFileSync(file, "utf8")));
    if (!parsed.ok) throw new Error(parsed.error);
    const s = parsed.value;
    const arrow = s.elements.find((e) => e.id === "flecha") as Element & {
      x: number;
    };
    expect(animate(arrow, 0, s).el.x).toBeLessThan(0);
    for (const id of ["paso1", "paso2", "paso3"]) {
      const sq = s.elements.find((e) => e.id === id) as Element & {
        fill: { color: string };
      };
      const color = (t: number) =>
        (animate(sq, t, s).el as typeof sq).fill.color;
      expect(color(0)).not.toBe("#2563eb");
      expect(color(s.duration - 0.01)).toBe("#2563eb");
    }
  });
});
