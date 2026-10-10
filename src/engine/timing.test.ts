import { describe, expect, it } from "vitest";
import { localProgress, type Timing } from "./timing.ts";

const timing = (patch: Partial<Timing>): Timing => ({
  delay: 0,
  duration: 1,
  iterations: 1,
  direction: "normal",
  fill: "none",
  easing: (x) => x,
  ...patch,
});

describe("localProgress", () => {
  it("has no effect outside its active time without fill", () => {
    const tm = timing({ delay: 1, duration: 2 });
    expect(localProgress(tm, 0.5)).toBeNull();
    expect(localProgress(tm, 2)).toBeCloseTo(0.5);
    expect(localProgress(tm, 3)).toBeNull();
  });

  it("fill holds the start before the delay and the end after the last iteration", () => {
    const tm = timing({ delay: 1, fill: "both" });
    expect(localProgress(tm, 0)).toBe(0);
    expect(localProgress(tm, 5)).toBe(1);
    expect(localProgress(timing({ fill: "forwards", delay: 1 }), 0)).toBeNull();
    expect(localProgress(timing({ fill: "backwards" }), 5)).toBeNull();
  });

  it("repeats N times then holds the end of the last iteration", () => {
    const tm = timing({ iterations: 3, fill: "forwards" });
    expect(localProgress(tm, 1.25)).toBeCloseTo(0.25);
    expect(localProgress(tm, 2.5)).toBeCloseTo(0.5);
    expect(localProgress(tm, 10)).toBe(1);
    // A fractional count stops part-way through.
    expect(
      localProgress(timing({ iterations: 1.5, fill: "forwards" }), 9),
    ).toBe(0.5);
  });

  it("directions: reverse plays backwards, alternate swaps every iteration", () => {
    expect(localProgress(timing({ direction: "reverse" }), 0.25)).toBeCloseTo(
      0.75,
    );
    const alt = timing({
      direction: "alternate",
      iterations: 2,
      fill: "forwards",
    });
    expect(localProgress(alt, 0.25)).toBeCloseTo(0.25);
    expect(localProgress(alt, 1.25)).toBeCloseTo(0.75);
    expect(localProgress(alt, 9)).toBe(0);
  });

  it("forever is periodic for every t, before the delay too", () => {
    const tm = timing({ iterations: Infinity, delay: 0.3, duration: 0.5 });
    for (const t of [-1, 0, 0.1, 0.77, 3.9]) {
      expect(localProgress(tm, t + 0.5)).toBeCloseTo(
        localProgress(tm, t) ?? NaN,
      );
    }
    expect(localProgress(tm, 0.3)).toBeCloseTo(0);
  });

  it("applies the easing after the direction", () => {
    const tm = timing({ direction: "reverse", easing: (x) => x * x });
    expect(localProgress(tm, 0.25)).toBeCloseTo(0.75 ** 2);
  });
});
