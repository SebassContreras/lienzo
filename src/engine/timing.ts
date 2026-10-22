/**
 * The Web Animations timing model, reduced to what preset animations use: from a slot's
 * timing and `t`, the eased progress of its current iteration. Pure, so exports stay
 * deterministic.
 */
import type { EasingFn } from "./easing.ts";

type Direction = "normal" | "reverse" | "alternate";
type Fill = "none" | "forwards" | "backwards" | "both";

export type Timing = {
  /** Seconds before the first iteration starts. */
  delay: number;
  /** Seconds per iteration. */
  duration: number;
  /** How many times it plays; `Infinity` repeats forever. */
  iterations: number;
  direction: Direction;
  /** Whether the start state shows before `delay` and the end state after the last iteration. */
  fill: Fill;
  easing: EasingFn;
};

const fillsBackwards = (f: Fill) => f === "backwards" || f === "both";
const fillsForwards = (f: Fill) => f === "forwards" || f === "both";

/**
 * Eased progress (0–1, past either end for easings that overshoot) at `t`, or `null` when
 * the animation has no effect then (outside its active time, without fill). One that
 * repeats forever is periodic for every `t`, before its delay too, so a loop of whole cycles
 * closes at the scene's end (A6).
 */
export function localProgress(timing: Timing, t: number): number | null {
  const { delay, duration, iterations, direction, fill, easing } = timing;
  const local = t - delay;
  let iteration: number;
  let p: number;
  if (duration <= 0) {
    if (local < 0 && !fillsBackwards(fill)) return null;
    if (local >= 0 && !fillsForwards(fill)) return null;
    iteration = local < 0 ? 0 : Math.max(0, iterations - 1);
    p = local < 0 ? 0 : 1;
  } else if (iterations === Infinity) {
    const overall = local / duration;
    iteration = Math.floor(overall);
    p = overall - iteration;
  } else if (local < 0) {
    if (!fillsBackwards(fill)) return null;
    iteration = 0;
    p = 0;
  } else if (local >= duration * iterations) {
    if (!fillsForwards(fill)) return null;
    const end = iterations;
    iteration = Number.isInteger(end) ? end - 1 : Math.floor(end);
    p = Number.isInteger(end) ? 1 : end - Math.floor(end);
  } else {
    const overall = local / duration;
    iteration = Math.floor(overall);
    p = overall - iteration;
  }
  const reversed =
    direction === "reverse" ||
    (direction === "alternate" && Math.abs(iteration) % 2 === 1);
  return easing(reversed ? 1 - p : p);
}

/** A loop's iteration length: whole cycles per scene, so it closes at the scene's end (A6). */
export const loopDuration = (sceneDuration: number, cycles: number) =>
  sceneDuration / Math.max(1, cycles);
