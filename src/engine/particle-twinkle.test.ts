import { describe, expect, it } from "vitest";
import { defaultParticles } from "../model/model.ts";
import { twinkleAlphas } from "./particle-twinkle.ts";

const T = 4;
const field = { ...defaultParticles(), count: 50, twinkle: 0.8 };

describe("twinkling particles", () => {
  it("leaves the field alone when twinkle is 0", () => {
    expect(twinkleAlphas({ ...field, twinkle: 0 }, 1, T)).toBeNull();
  });

  it("changes each point's opacity over the loop", () => {
    const a = Array.from(twinkleAlphas(field, 0, T) ?? []);
    const b = Array.from(twinkleAlphas(field, 1, T) ?? []);

    expect(b).not.toEqual(a);
  });

  it("closes the loop: t = 0 and t = T give the same opacities", () => {
    const a = twinkleAlphas(field, 0, T) ?? new Float64Array();
    const b = Array.from(twinkleAlphas(field, T, T) ?? []);

    expect(b.map((v) => Number(v.toFixed(9)))).toEqual(
      Array.from(a, (v) => Number(v.toFixed(9))),
    );
  });

  it("keeps opacities between 1 − twinkle and 1", () => {
    const alphas = Array.from(twinkleAlphas(field, 2.3, T) ?? []);

    expect(Math.min(...alphas)).toBeGreaterThanOrEqual(
      1 - field.twinkle - 1e-9,
    );
    expect(Math.max(...alphas)).toBeLessThanOrEqual(1);
  });
});
