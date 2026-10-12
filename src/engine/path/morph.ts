/**
 * Morph interpolation (024/D6), pure: a `morph` value picks two neighbouring shapes of the
 * list (0 = first, 1 = second…), eases between them, and gives the in-between points and
 * style. The same value always gives the same frame (R8).
 */
import type { EasingFn } from "../easing.ts";
import { mixColor } from "../paint.ts";
import type { MorphPair, Points } from "./morph-prep.ts";

/** Where a `morph` value sits: from shape `i` towards `i + 1`, `k` (eased, 0–1) of the way. */
export type Span = { i: number; k: number };

/** What a shape looks like besides its outline (R7). */
export type ShapeStyle = {
  fill: string;
  stroke: string;
  opacity: number;
  width: number;
};

/** The span `morph` falls in among `count` shapes, clamped to the list's ends. */
export function spanAt(morph: number, count: number, ease: EasingFn): Span {
  if (count < 2 || !(morph > 0)) return { i: 0, k: 0 };
  const m = Math.min(morph, count - 1);
  const i = Math.min(Math.floor(m), count - 2);
  return { i, k: ease(m - i) };
}

/** The rings `k` of the way through the prepared pairs. */
export function interpolate(
  pairs: readonly MorphPair[],
  k: number,
): { pts: Points; closed: boolean }[] {
  return pairs.map(({ a, b, closed }) => ({
    pts: a.map((v, j) => v + ((b[j] as number) - v) * k),
    closed,
  }));
}

/** Colours, opacity and stroke width `k` of the way from `a` to `b`, with the shape's easing. */
export function mixStyle(a: ShapeStyle, b: ShapeStyle, k: number): ShapeStyle {
  return {
    fill: mixColor(a.fill, b.fill, k),
    stroke: mixColor(a.stroke, b.stroke, k),
    opacity: a.opacity + (b.opacity - a.opacity) * k,
    width: a.width + (b.width - a.width) * k,
  };
}
