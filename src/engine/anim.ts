import type { Anim } from "../model/model.ts";

/** Entry animations (fade-in, pop-in, slide-up, draw) take this long. */
export const ENTRY_SEC = 0.8;

export const easeOut = (x: number) => 1 - (1 - x) ** 3;
const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
};
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

/**
 * How an element looks at time `t` (seconds within the loop). Looping kinds complete
 * `anim.cycles` whole cycles per `duration`, so the loop is seamless.
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
  const phase = ((t - anim.delay) / duration) * anim.cycles * Math.PI * 2;
  const entry = clamp01((t - anim.delay) / ENTRY_SEC);
  switch (anim.kind) {
    case "float":
      state.dy = -Math.sin(phase) * anim.amount;
      break;
    case "pulse":
      state.scale = 1 + (anim.amount / 100) * (0.5 - 0.5 * Math.cos(phase));
      break;
    case "breathe":
      state.glowMul = Math.max(0, 1 + (anim.amount / 100) * Math.sin(phase));
      break;
    case "fade-in":
      state.alpha = easeOut(entry);
      break;
    case "pop-in":
      state.alpha = clamp01(entry * 2);
      state.scale = Math.max(0, easeOutBack(entry));
      break;
    case "slide-up":
      state.alpha = easeOut(entry);
      state.dy = (1 - easeOut(entry)) * anim.amount;
      break;
    case "draw":
      state.progress = easeOut(entry);
      break;
    case "none":
      break;
  }
  return state;
}
