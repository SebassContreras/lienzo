import { describe, expect, it } from "vitest";
import { defaultParticles } from "../model/model.ts";
import { linkAlpha, mulberry32, particlePositions } from "./particle-field.ts";

const field = { ...defaultParticles(), w: 500, h: 300, count: 300, speed: 4 };
const T = 4;

describe("particle field", () => {
  it("closes the loop: t = 0 and t = T give the same points", () => {
    const a = particlePositions(field, 0, T);
    const b = particlePositions(field, T, T);
    expect(a.length).toBe(600);
    a.forEach((v, i) => {
      expect(b[i]).toBeCloseTo(v, 9);
    });
  });

  it("is deterministic: same inputs, same points; another seed, other points", () => {
    const a = Array.from(particlePositions(field, 1.3, T));
    const b = Array.from(particlePositions({ ...field }, 1.3, T));
    expect(b).toEqual(a);
    const c = Array.from(particlePositions({ ...field, seed: 2 }, 1.3, T));
    expect(c).not.toEqual(a);
  });

  it("actually moves", () => {
    const a = particlePositions(field, 0, T);
    const b = particlePositions(field, 1, T);
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });

  it("keeps every point inside the box at every moment", () => {
    for (const drift of [0, 40, 400]) {
      const el = { ...field, drift };
      for (let t = 0; t <= T; t += 0.05) {
        const pos = particlePositions(el, t, T);
        for (let i = 0; i < pos.length; i += 2) {
          expect(pos[i]).toBeGreaterThanOrEqual(0);
          expect(pos[i]).toBeLessThanOrEqual(el.w);
          expect(pos[i + 1]).toBeGreaterThanOrEqual(0);
          expect(pos[i + 1]).toBeLessThanOrEqual(el.h);
        }
      }
    }
  });

  it("caps the count at 300", () => {
    expect(particlePositions({ ...field, count: 1000 }, 0, T).length).toBe(600);
  });

  it("seeded PRNG repeats and stays in [0, 1)", () => {
    const r1 = mulberry32(5);
    const r2 = mulberry32(5);
    for (let i = 0; i < 100; i++) {
      const v = r1();
      expect(r2()).toBe(v);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("linkAlpha", () => {
  it("fades linearly from full opacity to nothing at the link distance", () => {
    expect(linkAlpha(0, 100, 0.5)).toBe(0.5);
    expect(linkAlpha(50, 100, 0.5)).toBeCloseTo(0.25);
    expect(linkAlpha(75, 100, 1)).toBeCloseTo(0.25);
    expect(linkAlpha(100, 100, 1)).toBe(0);
    expect(linkAlpha(150, 100, 1)).toBe(0);
  });

  it("draws no links when the distance is 0", () => {
    expect(linkAlpha(0, 0, 1)).toBe(0);
  });
});
