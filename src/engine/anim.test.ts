import { describe, expect, it } from "vitest";
import { rest } from "../animations/index.ts";
import {
  ANIM_KINDS,
  type AnimKind,
  migrateAnim,
} from "../components/fields/index.ts";
import { type Anim, defaultRect, defaultScene } from "../model/model.ts";
import { parseScene } from "../model/schema.ts";
import { type AnimState, animState, lateSlots } from "./anim.ts";

const base = (): Anim => defaultRect().anim;

const withSlots = (patch: {
  in?: Partial<Anim["in"]>;
  loop?: Partial<Anim["loop"]>;
  out?: Partial<Anim["out"]>;
}): Anim => {
  const a = base();
  return {
    ...a,
    in: { ...a.in, ...patch.in },
    loop: { ...a.loop, ...patch.loop },
    out: { ...a.out, ...patch.out },
  };
};

/** How an element animated before spec 013: one flat animation, entries 0.8 s. */
function before(
  a: { kind: AnimKind; amount: number; cycles: number; delay: number },
  t: number,
  duration: number,
): AnimState {
  const easeOut = (x: number) => 1 - (1 - x) ** 3;
  const back = (x: number) =>
    1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const s = rest();
  const phase = ((t - a.delay) / duration) * a.cycles * Math.PI * 2;
  const e = clamp((t - a.delay) / 0.8);
  if (a.kind === "float") s.dy = -Math.sin(phase) * a.amount;
  if (a.kind === "pulse")
    s.scale = 1 + (a.amount / 100) * (0.5 - 0.5 * Math.cos(phase));
  if (a.kind === "breathe")
    s.glowMul = Math.max(0, 1 + (a.amount / 100) * Math.sin(phase));
  if (a.kind === "fade-in") s.alpha = easeOut(e);
  if (a.kind === "pop-in") {
    s.alpha = clamp(e * 2);
    s.scale = Math.max(0, back(e));
  }
  if (a.kind === "slide-up") {
    s.alpha = easeOut(e);
    s.dy = (1 - easeOut(e)) * a.amount;
  }
  if (a.kind === "draw") s.progress = easeOut(e);
  return s;
}

function expectState(a: AnimState, b: AnimState, msg = "") {
  for (const k of Object.keys(b) as (keyof AnimState)[]) {
    const [x, y] = [a[k], b[k]];
    if (typeof x === "number" && typeof y === "number")
      expect(x, `${msg} ${k}`).toBeCloseTo(y, 9);
    else expect(x, `${msg} ${k}`).toBe(y);
  }
}

describe("animState", () => {
  it("an old flat animation, moved into its slot, plays exactly as before (R5)", () => {
    for (const kind of ANIM_KINDS) {
      for (const [amount, cycles, delay] of [
        [12, 1, 0],
        [30, 3, 0.7],
      ] as const) {
        const old = { kind, amount, cycles, delay };
        const now = migrateAnim(old) as Anim;
        for (let t = 0; t <= 4; t += 0.05) {
          expectState(animState(now, t, 4), before(old, t, 4), `${kind}@${t}`);
        }
      }
    }
  });

  it("a scene saved before slots reads into them", () => {
    const scene = JSON.parse(JSON.stringify(defaultScene()));
    const rect = JSON.parse(JSON.stringify(defaultRect()));
    rect.anim = { kind: "pop-in", amount: 5, cycles: 1, delay: 0.4 };
    scene.elements = [rect];
    const r = parseScene(scene);
    if (!r.ok) throw new Error(r.error);
    const anim = (r.value.elements[0] as typeof rect).anim as Anim;
    expect(anim.in).toMatchObject({ kind: "pop", amount: 5, delay: 0.4 });
    expect(anim.loop.kind).toBe("none");
    expect(anim.out.kind).toBe("none");
  });

  it("entry, loop and exit combine on one element (R1)", () => {
    const a = withSlots({
      in: { kind: "fade", delay: 0, duration: 1 },
      loop: { kind: "float", amount: 10 },
      out: { kind: "fade", delay: 3, duration: 1 },
    });
    expect(animState(a, 0, 4).alpha).toBe(0);
    const mid = animState(a, 1, 4);
    expect(mid.alpha).toBe(1);
    expect(mid.dy).toBeCloseTo(-10);
    expect(animState(a, 3, 4).alpha).toBe(1);
    expect(animState(a, 3.5, 4).alpha).toBeGreaterThan(0);
    expect(animState(a, 3.5, 4).alpha).toBeLessThan(1);
    expect(animState(a, 4, 4).alpha).toBe(0);
  });

  it("an entry hides before its start and holds its end; an exit holds hidden (R3)", () => {
    for (const kind of ["fade", "pop", "slide"] as const) {
      const entry = withSlots({ in: { kind, delay: 1, duration: 0.5 } });
      expect(animState(entry, 0.5, 4).alpha, kind).toBe(0);
      expectState(animState(entry, 3, 4), animState(base(), 3, 4), kind);
      const exit = withSlots({ out: { kind, delay: 1, duration: 0.5 } });
      expectState(animState(exit, 0.5, 4), animState(base(), 0.5, 4), kind);
      expect(animState(exit, 3, 4).alpha, kind).toBe(0);
    }
    const draw = withSlots({ out: { kind: "draw", delay: 0, duration: 1 } });
    expect(animState(draw, 0, 4).progress).toBe(1);
    expect(animState(draw, 1, 4).progress).toBe(0);
  });

  it("an exit is its entry played backwards", () => {
    const entry = withSlots({ in: { kind: "slide", amount: 20, duration: 1 } });
    const exit = withSlots({
      out: { kind: "slide", amount: 20, delay: 0, duration: 1 },
    });
    for (const t of [0, 0.2, 0.5, 0.9]) {
      expectState(animState(exit, 1 - t, 4), animState(entry, t, 4), `t=${t}`);
    }
  });

  it("start, duration and easing shape the entry (R2)", () => {
    const linear = withSlots({
      in: { kind: "fade", delay: 1, duration: 2, easing: "linear" },
    });
    expect(animState(linear, 2, 4).alpha).toBeCloseTo(0.5);
    const bezier = withSlots({
      in: { kind: "fade", duration: 1, easing: "cubic-bezier(0, 0, 1, 1)" },
    });
    expect(animState(bezier, 0.3, 4).alpha).toBeCloseTo(0.3, 4);
    const quad = withSlots({
      in: { kind: "fade", duration: 1, easing: "quad-in" },
    });
    expect(animState(quad, 0.5, 4).alpha).toBeCloseTo(0.25);
  });

  it("a loop that plays forever closes exactly at the scene's end (R4, A6)", () => {
    for (const kind of ["float", "pulse", "breathe"] as const) {
      for (const cycles of [1, 2, 3]) {
        for (const direction of ["normal", "reverse", "alternate"] as const) {
          const a = withSlots({
            loop: { kind, cycles, delay: 0.7, direction, amount: 20 },
          });
          for (const t of [0, 0.3, 1.9]) {
            expectState(animState(a, t + 4, 4), animState(a, t, 4), kind);
          }
        }
      }
    }
  });

  it("a loop of N iterations rests after them; reverse mirrors it (R4)", () => {
    const twice = withSlots({
      loop: { kind: "float", amount: 10, cycles: 4, iterations: 2 },
    });
    expect(animState(twice, 0.25, 4).dy).toBeCloseTo(-10);
    expect(animState(twice, 1.25, 4).dy).toBeCloseTo(-10);
    expect(animState(twice, 2.25, 4).dy).toBe(0);
    const reverse = withSlots({
      loop: { kind: "float", amount: 10, direction: "reverse" },
    });
    expect(animState(reverse, 1, 4).dy).toBeCloseTo(10);
  });

  it("warns about entries and exits that end after the scene (R6)", () => {
    expect(lateSlots(base(), 4)).toEqual([]);
    const late = withSlots({
      in: { kind: "fade", delay: 3.5, duration: 0.8 },
      out: { kind: "fade", delay: 3.2, duration: 0.8 },
    });
    expect(lateSlots(late, 4)).toEqual(["Entrada"]);
    expect(lateSlots(late, 3)).toEqual(["Entrada", "Salida"]);
  });
});
