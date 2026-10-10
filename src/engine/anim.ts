import type { LoopKind, MotionKind } from "../components/fields/index.ts";
import type { Anim } from "../model/model.ts";
import { EASINGS, type EasingFn, easingFn } from "./easing.ts";
import { localProgress, loopDuration, type Timing } from "./timing.ts";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const frac = (x: number) => x - Math.floor(x);

export type AnimState = {
  dx: number;
  dy: number;
  scale: number;
  alpha: number;
  glowMul: number;
  /** 0–1, how much of a line is drawn ("draw"); 1 for every other kind. */
  progress: number;
};

type Delta = Partial<AnimState>;

/**
 * A kind: what it changes at linear progress `p` (0 → 1, already turned around by the
 * direction), given its easing and amount. Pure, so any slot can play it (D6).
 */
type KindFn = (p: number, ease: EasingFn, amount: number) => Delta;

type KindDef = { fn: KindFn; ease: EasingFn };

/** Entry kinds at progress 1 leave the element as it is; exits play them from 1 to 0. */
const MOTIONS: Record<Exclude<MotionKind, "none">, KindDef> = {
  fade: { ease: EASINGS["cubic-out"], fn: (p, e) => ({ alpha: e(p) }) },
  pop: {
    ease: EASINGS["back-out"],
    fn: (p, e) => ({ alpha: clamp01(p * 2), scale: Math.max(0, e(p)) }),
  },
  slide: {
    ease: EASINGS["cubic-out"],
    fn: (p, e, amount) => ({ alpha: e(p), dy: (1 - e(p)) * amount }),
  },
  draw: { ease: EASINGS["cubic-out"], fn: (p, e) => ({ progress: e(p) }) },
};

/** Loop kinds over one cycle; at 0 and 1 they leave the element as it is. */
const LOOPS: Record<Exclude<LoopKind, "none">, KindDef> = {
  float: {
    ease: EASINGS.linear,
    fn: (p, e, amount) => ({ dy: -Math.sin(e(p) * Math.PI * 2) * amount }),
  },
  pulse: {
    ease: EASINGS.linear,
    fn: (p, e, amount) => ({
      scale: 1 + (amount / 100) * (0.5 - 0.5 * Math.cos(e(p) * Math.PI * 2)),
    }),
  },
  breathe: {
    ease: EASINGS.linear,
    fn: (p, e, amount) => ({
      glowMul: Math.max(0, 1 + (amount / 100) * Math.sin(e(p) * Math.PI * 2)),
    }),
  },
};

const linear = EASINGS.linear;

function apply(state: AnimState, d: Delta): void {
  state.dx += d.dx ?? 0;
  state.dy += d.dy ?? 0;
  state.scale *= d.scale ?? 1;
  state.alpha *= d.alpha ?? 1;
  state.glowMul *= d.glowMul ?? 1;
  state.progress *= d.progress ?? 1;
}

/** Linear progress of a slot at `t` (easing is the kind's to apply), or null when idle. */
const progressAt = (timing: Omit<Timing, "easing">, t: number) =>
  localProgress({ ...timing, easing: linear }, t);

/**
 * How an element looks at time `t` (seconds within the loop): its entry, loop and exit,
 * composed (offsets add, the rest multiply). A loop completes `cycles` whole cycles per
 * `duration`, so one that repeats forever is seamless (A6).
 */
export function animState(anim: Anim, t: number, duration: number): AnimState {
  const state: AnimState = {
    dx: 0,
    dy: 0,
    scale: 1,
    alpha: 1,
    glowMul: 1,
    progress: 1,
  };
  const { in: entry, loop, out } = anim;
  if (entry.kind !== "none") {
    const def = MOTIONS[entry.kind];
    const p = progressAt(
      {
        delay: entry.delay,
        duration: entry.duration,
        iterations: 1,
        direction: "normal",
        fill: "both",
      },
      t,
    );
    if (p !== null)
      apply(state, def.fn(p, easingFn(entry.easing, def.ease), entry.amount));
  }
  if (loop.kind !== "none") {
    const def = LOOPS[loop.kind];
    const p = progressAt(
      {
        delay: loop.delay,
        // Alternating, a cycle is one way and back, so the loop still closes (A6).
        duration:
          loopDuration(duration, loop.cycles) /
          (loop.direction === "alternate" ? 2 : 1),
        iterations: loop.iterations === "infinite" ? Infinity : loop.iterations,
        direction: loop.direction,
        fill: "none",
      },
      t,
    );
    if (p !== null)
      apply(state, def.fn(p, easingFn(loop.easing, def.ease), loop.amount));
  }
  if (out.kind !== "none") {
    const def = MOTIONS[out.kind];
    const p = progressAt(
      {
        delay: out.delay,
        duration: out.duration,
        iterations: 1,
        direction: "reverse",
        fill: "forwards",
      },
      t,
    );
    if (p !== null)
      apply(state, def.fn(p, easingFn(out.easing, def.ease), out.amount));
  }
  return state;
}

/** The slots ("Entrada", "Salida") that are set and end after a scene of `duration` s. */
export function lateSlots(anim: Anim, duration: number): string[] {
  const late: string[] = [];
  for (const [slot, name] of [
    [anim.in, "Entrada"],
    [anim.out, "Salida"],
  ] as const) {
    if (slot.kind !== "none" && slot.delay + slot.duration > duration + 1e-9)
      late.push(name);
  }
  return late;
}
