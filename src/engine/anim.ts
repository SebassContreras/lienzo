import {
  type AnimState,
  type Delta,
  DIRS,
  LOOPS,
  MOTIONS,
  rest,
} from "../animations/index.ts";
import type { Anim } from "../model/model.ts";
import { EASINGS, easingFn } from "./easing.ts";
import { localProgress, loopDuration, type Timing } from "./timing.ts";

export { type AnimState, clamp01 } from "../animations/index.ts";

export const frac = (x: number) => x - Math.floor(x);

const linear = EASINGS.linear;

function apply(state: AnimState, d: Delta): void {
  state.dx += d.dx ?? 0;
  state.dy += d.dy ?? 0;
  state.scale *= d.scale ?? 1;
  state.scaleX *= d.scaleX ?? 1;
  state.scaleY *= d.scaleY ?? 1;
  state.rotate += d.rotate ?? 0;
  state.skewX += d.skewX ?? 0;
  state.skewY += d.skewY ?? 0;
  state.alpha *= d.alpha ?? 1;
  state.glowMul *= d.glowMul ?? 1;
  state.progress *= d.progress ?? 1;
  state.reveal *= d.reveal ?? 1;
  if (d.revealUnit) state.revealUnit = d.revealUnit;
  if (d.revealSoft !== undefined) state.revealSoft = d.revealSoft;
}

/** Linear progress of a slot at `t` (easing is the kind's to apply), or null when idle. */
const progressAt = (timing: Omit<Timing, "easing">, t: number) =>
  localProgress({ ...timing, easing: linear }, t);

/**
 * How an element looks at time `t` (seconds within the loop): its entry, loop and exit,
 * composed (offsets and angles add, the rest multiply). A loop completes `cycles` whole cycles per
 * `duration`, so one that repeats forever is seamless (A6).
 */
export function animState(anim: Anim, t: number, duration: number): AnimState {
  const state = rest();
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
      apply(
        state,
        def.fn(
          p,
          easingFn(entry.easing, def.ease),
          entry.amount,
          DIRS[entry.from],
        ),
      );
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
      apply(
        state,
        def.fn(p, easingFn(loop.easing, def.ease), loop.amount, DIRS.down),
      );
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
      apply(
        state,
        def.fn(p, easingFn(out.easing, def.ease), out.amount, DIRS[out.from]),
      );
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
