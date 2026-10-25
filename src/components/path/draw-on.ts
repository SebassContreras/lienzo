import type { Element } from "../../model/model.ts";

/** Stroke width a path gets when it draws itself on and has none (063/D4). */
export const DRAW_ON_WIDTH = 3;

/**
 * Paths default to no stroke, but the "draw" entrance or exit reveals the stroke, so a path
 * using it with no stroke gets `DRAW_ON_WIDTH`; a width already set is kept (063/D4).
 */
export function ensureDrawOnStroke(el: Element): void {
  if (el.kind !== "path" || el.border.width > 0) return;
  if (el.anim.in.kind === "draw" || el.anim.out.kind === "draw") {
    el.border.width = DRAW_ON_WIDTH;
  }
}
