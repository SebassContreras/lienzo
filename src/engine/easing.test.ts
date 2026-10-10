import { describe, expect, it } from "vitest";
import {
  cubicBezier,
  EASING_NAMES,
  EASINGS,
  EasingSchema,
  easingFn,
} from "./easing.ts";

describe("easings", () => {
  it("every easing starts at 0 and ends at 1", () => {
    for (const name of EASING_NAMES) {
      expect(EASINGS[name](0), name).toBeCloseTo(0, 6);
      expect(EASINGS[name](1), name).toBeCloseTo(1, 6);
    }
  });

  it("cubic-bezier matches the curve it is equivalent to", () => {
    const linear = cubicBezier(0, 0, 1, 1);
    for (const x of [0.1, 0.37, 0.5, 0.9]) {
      expect(linear(x)).toBeCloseTo(x, 5);
    }
    // ease-in-out is symmetric about the middle.
    const io = EASINGS["ease-in-out"];
    expect(io(0.5)).toBeCloseTo(0.5, 5);
    expect(io(0.2) + io(0.8)).toBeCloseTo(1, 5);
  });

  it("parses cubic-bezier strings and falls back for auto", () => {
    const fallback = (x: number) => x * x;
    expect(easingFn("auto", fallback)).toBe(fallback);
    expect(easingFn("cubic-bezier(0, 0, 1, 1)", fallback)(0.3)).toBeCloseTo(
      0.3,
      5,
    );
    expect(easingFn("back-out", fallback)).toBe(EASINGS["back-out"]);
  });

  it("the schema takes names, auto and valid cubic-bezier only", () => {
    for (const ok of [
      "auto",
      "linear",
      "bounce-out",
      "cubic-bezier(.2,1.4,.6,1)",
    ])
      expect(EasingSchema.safeParse(ok).success, ok).toBe(true);
    for (const bad of ["springy", "cubic-bezier(2,0,1,1)", "cubic-bezier(1,2)"])
      expect(EasingSchema.safeParse(bad).success, bad).toBe(false);
  });
});
