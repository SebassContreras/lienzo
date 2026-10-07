import { describe, expect, it } from "vitest";
import type { Anim } from "../model/model.ts";
import { animState, ENTRY_SEC } from "./anim.ts";

const anim = (patch: Partial<Anim>): Anim => ({
  kind: "none",
  amount: 12,
  cycles: 1,
  delay: 0,
  ...patch,
});

describe("animState", () => {
  it("looping animations are periodic over the scene duration", () => {
    const duration = 4;
    for (const kind of ["float", "pulse", "breathe"] as const) {
      for (const cycles of [1, 2, 3]) {
        const a = anim({ kind, cycles, delay: 0.7 });
        for (const t of [0, 0.3, 1.9]) {
          const now = animState(a, t, duration);
          const later = animState(a, t + duration, duration);
          expect(later.dy).toBeCloseTo(now.dy, 6);
          expect(later.scale).toBeCloseTo(now.scale, 6);
          expect(later.glowMul).toBeCloseTo(now.glowMul, 6);
        }
      }
    }
  });

  it("entry animations start hidden and end fully visible in place", () => {
    for (const kind of ["fade-in", "pop-in", "slide-up"] as const) {
      const a = anim({ kind, delay: 0.5 });
      expect(animState(a, 0.5, 4).alpha).toBe(0);
      const done = animState(a, 0.5 + ENTRY_SEC, 4);
      expect(done.alpha).toBe(1);
      expect(done.scale).toBeCloseTo(1, 6);
      expect(done.dy).toBeCloseTo(0, 6);
    }
  });

  it("draw progresses from 0 to 1", () => {
    const a = anim({ kind: "draw" });
    expect(animState(a, 0, 4).progress).toBe(0);
    expect(animState(a, ENTRY_SEC, 4).progress).toBe(1);
  });
});
