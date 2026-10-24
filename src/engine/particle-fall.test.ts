import { describe, expect, it } from "vitest";
import { defaultParticles } from "../model/model.ts";
import { fallPositions } from "./particle-fall.ts";

const T = 4;
const field = {
  ...defaultParticles(),
  w: 400,
  h: 300,
  count: 200,
  speed: 1,
  motion: "fall" as const,
};

/** Every coordinate as a number, `NaN` written as `null` so arrays compare. */
const plain = (pos: Float64Array) =>
  Array.from(pos, (v) => (Number.isNaN(v) ? null : Number(v.toFixed(6))));

describe("falling particles (057/R3)", () => {
  it.each([90, 0, 45])("closes the loop when falling at %i°", (direction) => {
    const el = { ...field, direction, speed: 2.5 };

    const start = fallPositions(el, 0, T);
    const end = fallPositions(el, T, T);

    expect(plain(end)).toEqual(plain(start));
  });

  it("moves a point downwards at 90°", () => {
    const one = { ...field, count: 1, direction: 90 };
    const at = (t: number) => fallPositions(one, t, T, Infinity);

    const before = at(0)[1] as number;
    const after = at(0.01)[1] as number;

    expect(after).toBeGreaterThan(before);
    expect(at(0.01)[0]).toBeCloseTo(at(0)[0] as number, 9);
  });

  it("moves points to the right at 0°", () => {
    const one = { ...field, count: 1, direction: 0 };

    const before = fallPositions(one, 0, T, Infinity)[0] as number;
    const after = fallPositions(one, 0.01, T, Infinity)[0] as number;

    expect(after).toBeGreaterThan(before);
  });

  it("starts each crossing slower than it ends under gravity", () => {
    const heavy = { ...field, count: 1, gravity: 3, speed: 1 };
    // a whole crossing per loop: progress τ = u0 + t/T, so step from the start of a crossing
    const path = (t: number) =>
      fallPositions(heavy, t, T, Infinity)[1] as number;
    const tauStart = (1 - startPhase(heavy)) * T;
    const early = path(tauStart + 0.1) - path(tauStart);
    const late = path(tauStart + T - 0.1) - path(tauStart + T - 0.2);

    // gravity 3 gives a = 0.75: the pace grows from 0.25 to 1.75 times the mean
    expect(late).toBeGreaterThan(early * 4);
  });

  it("falls at an even pace without gravity", () => {
    const even = { ...field, count: 1, gravity: 0 };
    const path = (t: number) =>
      fallPositions(even, t, T, Infinity)[1] as number;
    const tauStart = (1 - startPhase(even)) * T;

    const early = path(tauStart + 0.1) - path(tauStart);
    const late = path(tauStart + T - 0.1) - path(tauStart + T - 0.2);

    expect(late).toBeCloseTo(early, 9);
  });

  it("keeps every point it returns within the box and its margin", () => {
    const el = { ...field, direction: 30 };
    const margin = 5;

    const pos = Array.from(fallPositions(el, 1.7, T, margin)).filter(
      (v) => !Number.isNaN(v),
    );

    expect(pos.length).toBeGreaterThan(0);
    expect(Math.min(...pos)).toBeGreaterThanOrEqual(-margin);
    expect(Math.max(...pos)).toBeLessThanOrEqual(el.w + margin);
  });
});

/**
 * Where in its crossing the lone point starts, 0–1, read off its height at 90° with no
 * gravity: it runs through a square of side hypot(w, h) centred on the box.
 */
function startPhase(el: typeof field): number {
  const side = Math.hypot(el.w, el.h);
  const y = fallPositions(
    { ...el, gravity: 0, direction: 90 },
    0,
    T,
    Infinity,
  )[1] as number;
  return (y - el.h / 2) / side + 0.5;
}
