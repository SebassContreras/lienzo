/**
 * Easings: functions from linear progress (0–1) to eased progress, shared by preset
 * animations (013) and keyframes (015). Names follow CSS (`ease-in-out`) and the Penner
 * families (`back-out`); `cubic-bezier(x1, y1, x2, y2)` is solved the way browsers do.
 */
import { z } from "zod";

export type EasingFn = (x: number) => number;

const C1 = 1.70158;
const C2 = C1 * 1.525;
const C3 = C1 + 1;
const C4 = (2 * Math.PI) / 3;
const C5 = (2 * Math.PI) / 4.5;

function bounceOut(x: number): number {
  const n = 7.5625;
  const d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x - 1.5 / d) ** 2 + 0.75;
  if (x < 2.5 / d) return n * (x - 2.25 / d) ** 2 + 0.9375;
  return n * (x - 2.625 / d) ** 2 + 0.984375;
}

/**
 * The cubic Bézier through (0,0), (x1,y1), (x2,y2), (1,1) as a function of x: Newton–Raphson
 * on x(s), falling back to bisection where the slope is too flat, as in WebKit's solver.
 */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): EasingFn {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (s: number) => ((ax * s + bx) * s + cx) * s;
  const sy = (s: number) => ((ay * s + by) * s + cy) * s;
  const dx = (s: number) => (3 * ax * s + 2 * bx) * s + cx;
  const solve = (x: number) => {
    let s = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(s) - x;
      if (Math.abs(err) < 1e-7) return s;
      const d = dx(s);
      if (Math.abs(d) < 1e-6) break;
      s -= err / d;
    }
    let lo = 0;
    let hi = 1;
    s = x;
    while (lo < hi) {
      const v = sx(s);
      if (Math.abs(v - x) < 1e-7) return s;
      if (x > v) lo = s;
      else hi = s;
      s = (lo + hi) / 2;
      if (hi - lo < 1e-7) break;
    }
    return s;
  };
  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : sy(solve(x)));
}

export const EASINGS = {
  linear: (x: number) => x,
  ease: cubicBezier(0.25, 0.1, 0.25, 1),
  "ease-in": cubicBezier(0.42, 0, 1, 1),
  "ease-out": cubicBezier(0, 0, 0.58, 1),
  "ease-in-out": cubicBezier(0.42, 0, 0.58, 1),
  "quad-in": (x: number) => x * x,
  "quad-out": (x: number) => 1 - (1 - x) ** 2,
  "quad-in-out": (x: number) =>
    x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2,
  "cubic-in": (x: number) => x ** 3,
  "cubic-out": (x: number) => 1 - (1 - x) ** 3,
  "cubic-in-out": (x: number) =>
    x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2,
  "back-in": (x: number) => C3 * x ** 3 - C1 * x * x,
  "back-out": (x: number) => 1 + C3 * (x - 1) ** 3 + C1 * (x - 1) ** 2,
  "back-in-out": (x: number) =>
    x < 0.5
      ? ((2 * x) ** 2 * ((C2 + 1) * 2 * x - C2)) / 2
      : ((2 * x - 2) ** 2 * ((C2 + 1) * (x * 2 - 2) + C2) + 2) / 2,
  "bounce-in": (x: number) => 1 - bounceOut(1 - x),
  "bounce-out": bounceOut,
  "bounce-in-out": (x: number) =>
    x < 0.5 ? (1 - bounceOut(1 - 2 * x)) / 2 : (1 + bounceOut(2 * x - 1)) / 2,
  "elastic-in": (x: number) =>
    x <= 0
      ? 0
      : x >= 1
        ? 1
        : -(2 ** (10 * x - 10)) * Math.sin((x * 10 - 10.75) * C4),
  "elastic-out": (x: number) =>
    x <= 0
      ? 0
      : x >= 1
        ? 1
        : 2 ** (-10 * x) * Math.sin((x * 10 - 0.75) * C4) + 1,
  "elastic-in-out": (x: number) =>
    x <= 0
      ? 0
      : x >= 1
        ? 1
        : x < 0.5
          ? -(2 ** (20 * x - 10) * Math.sin((20 * x - 11.125) * C5)) / 2
          : (2 ** (-20 * x + 10) * Math.sin((20 * x - 11.125) * C5)) / 2 + 1,
} satisfies Record<string, EasingFn>;

export type EasingName = keyof typeof EASINGS;

export const EASING_NAMES = Object.keys(EASINGS) as EasingName[];

/** `auto` is the curve the animation kind uses by itself. */
export type Easing = "auto" | EasingName | `cubic-bezier(${string})`;

const BEZIER =
  /^cubic-bezier\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/;

/** The four numbers of a valid `cubic-bezier(…)` (x1 and x2 within 0–1), else undefined. */
function bezierArgs(s: string): [number, number, number, number] | undefined {
  const m = BEZIER.exec(s);
  if (!m) return undefined;
  const n = m.slice(1).map(Number) as [number, number, number, number];
  if (n.some((v) => !Number.isFinite(v))) return undefined;
  if (n[0] < 0 || n[0] > 1 || n[2] < 0 || n[2] > 1) return undefined;
  return n;
}

export const EasingSchema: z.ZodType<Easing> = z
  .string()
  .refine((s) => s === "auto" || s in EASINGS || bezierArgs(s) !== undefined, {
    message: "unknown easing",
  }) as z.ZodType<Easing>;

/** The function for `easing`; `auto` (and anything unknown) is `fallback`. */
export function easingFn(easing: Easing, fallback: EasingFn): EasingFn {
  if (easing in EASINGS) return EASINGS[easing as EasingName];
  const args = bezierArgs(easing);
  return args ? cubicBezier(...args) : fallback;
}
