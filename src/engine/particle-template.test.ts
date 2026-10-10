import { describe, expect, it } from "vitest";
import { installCanvasFakes, RecordingCtx } from "../test/recording-ctx.ts";

installCanvasFakes();
const { createElement } = await import("../components/index.ts");
const { drawElements } = await import("./render.ts");
const { defaultScene } = await import("../model/model.ts");
const { parseScene } = await import("../model/schema.ts");
const { looksOf } = await import("./particle-field.ts");
type ParticlesEl = import("../model/model.ts").ParticlesEl;
type Ctx = import("./paint.ts").Ctx;

const scene = defaultScene();

/** A small field whose points vary in every way but hue (the fake canvas has no pixels). */
function field(): ParticlesEl {
  const p = createElement("particles");
  p.count = 12;
  p.variation = {
    sizeMin: 0.5,
    sizeMax: 2,
    rotation: 90,
    spin: 3,
    opacityMin: 0.2,
    opacityMax: 1,
    hueShift: 0,
  };
  return p;
}

function log(p: ParticlesEl, t: number): string[] {
  const ctx = new RecordingCtx();
  drawElements(ctx as unknown as Ctx, [p], scene, t);
  return ctx.log;
}

describe("particle templates", () => {
  it("same seed, same field; another seed, another one", () => {
    const p = field();
    expect(looksOf({ ...p })).toEqual(looksOf(p));
    expect(log({ ...p }, 1.3)).toEqual(log(p, 1.3));
    expect(looksOf({ ...p, seed: 2 })).not.toEqual(looksOf(p));
  });

  it("closes the loop, spins included", () => {
    const p = { ...field(), template: createElement("rect") };
    expect(log(p, scene.duration)).toEqual(log(p, 0));
    expect(log(p, scene.duration / 2)).not.toEqual(log(p, 0));
  });

  it("draws a group template, children and all, at every point", () => {
    const group = createElement("group");
    const text = createElement("text");
    text.text = "hola";
    group.children = [createElement("rect"), text];
    const p = { ...field(), template: group };
    const lines = log(p, 0);
    const draws = lines.filter((l) => l.startsWith("drawImage"));
    expect(draws).toHaveLength(12);
    expect(draws[0]).toContain("fillText(hola");
  });

  it("ignores the template's own animation", () => {
    const still = createElement("rect");
    const animated = {
      ...structuredClone(still),
      anim: { ...still.anim, in: { ...still.anim.in, kind: "fade" as const } },
    };
    const at = (template: typeof still) =>
      log({ ...field(), template }, 0).filter((l) => l.startsWith("drawImage"));
    expect(at(animated)).toEqual(at(still));
  });

  it("rejects a particle that is or holds particles", () => {
    const nested = { ...field(), template: createElement("particles") };
    const group = createElement("group");
    group.children = [createElement("particles")];
    const inGroup = { ...field(), template: group };
    for (const p of [nested, inGroup]) {
      expect(parseScene({ ...scene, elements: [p] }).ok).toBe(false);
    }
    const ok = { ...field(), template: createElement("rect") };
    expect(parseScene({ ...scene, elements: [ok] }).ok).toBe(true);
  });

  it("reads a particles element saved before templates as plain alike dots", () => {
    const { template: _t, variation: _v, ...old } = createElement("particles");
    const parsed = parseScene({ ...scene, elements: [old] });
    expect(parsed.ok).toBe(true);
    const p = (parsed.ok && parsed.value.elements[0]) as ParticlesEl;
    expect(p.template).toBe(null);
    expect(p.variation).toEqual(createElement("particles").variation);
    // the dots draw as one path, not as sprites
    expect(log(p, 0).some((l) => l.startsWith("drawImage"))).toBe(false);
  });
});
