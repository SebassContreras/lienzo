import type { EasingFn } from "../engine/easing.ts";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** How an element looks at one moment: what its animations change, composed. */
export type AnimState = {
  dx: number;
  dy: number;
  scale: number;
  /** Per-axis scale, on top of `scale`. */
  scaleX: number;
  scaleY: number;
  /** Degrees, around the box centre. */
  rotate: number;
  skewX: number;
  skewY: number;
  alpha: number;
  glowMul: number;
  /** 0–1, how much of a line is drawn ("draw"); 1 for every other kind. */
  progress: number;
  /** 0–1, how much of a text is shown, counted in `revealUnit`s (018/D8). */
  reveal: number;
  revealUnit: RevealUnit;
  /** The unit being revealed fades in, rather than appearing whole (typewriter). */
  revealSoft: boolean;
};

export type RevealUnit = "char" | "word" | "line";

/** The state of an element no animation changes. */
export const rest = (): AnimState => ({
  dx: 0,
  dy: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
  skewX: 0,
  skewY: 0,
  alpha: 1,
  glowMul: 1,
  progress: 1,
  reveal: 1,
  revealUnit: "char",
  revealSoft: false,
});

/** What one kind changes; anything left out stays as it is. */
export type Delta = Partial<AnimState>;

/** Where an entrance comes from (an exit goes to), as a unit vector in canvas axes. */
export type Dir = { x: number; y: number };

export const DIRS = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
} as const satisfies Record<string, Dir>;

export type DirName = keyof typeof DIRS;

/**
 * A kind: what it changes at linear progress `p` (0 → 1, already turned around by the
 * slot's direction), given its easing, amount and side. Pure, so any slot can play it
 * (013/D6).
 */
export type KindFn = (
  p: number,
  ease: EasingFn,
  amount: number,
  dir: Dir,
) => Delta;

export type KindDef = {
  /** Its name in the inspector. */
  label: string;
  /** The curve it uses when its easing is `auto`. */
  ease: EasingFn;
  fn: KindFn;
  /** What `amount` means for it, when it uses one. */
  amount?: { label: string; max: number };
  /** It comes from a side (`DIRS`). */
  directional?: true;
};
