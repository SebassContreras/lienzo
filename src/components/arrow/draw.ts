import type { AnimState } from "../../engine/anim.ts";
import type { Box, Pt } from "../../engine/geometry.ts";
import type { Ctx } from "../../engine/paint.ts";
import type { DrawContext } from "../descriptor.ts";
import { closedPath } from "../polygon/draw.ts";
import { drawShape } from "../rect/draw.ts";
import type { ArrowDir, ArrowEl } from "./descriptor.ts";

/** The arrow pointing right in a unit square: u along it, v across. */
function unitArrow(head: number, shaft: number): [number, number][] {
  const neck = 1 - head;
  const s0 = (1 - shaft) / 2;
  return [
    [0, s0],
    [neck, s0],
    [neck, 0],
    [1, 0.5],
    [neck, 1],
    [neck, 1 - s0],
    [0, 1 - s0],
  ];
}

/** The seven corners of a block arrow filling `box` and pointing `dir`. */
export function arrowPoints(
  box: Box,
  dir: ArrowDir,
  head: number,
  shaft: number,
): Pt[] {
  return unitArrow(head, shaft).map(([u, v]) => {
    const [x, y] =
      dir === "right"
        ? [u, v]
        : dir === "left"
          ? [1 - u, v]
          : dir === "down"
            ? [v, u]
            : [v, 1 - u];
    return { x: box.x + x * box.w, y: box.y + y * box.h };
  });
}

export function drawArrow(
  ctx: Ctx,
  el: ArrowEl,
  st: AnimState,
  dc: DrawContext,
): void {
  const path = closedPath(arrowPoints(el, el.direction, el.head, el.shaft));
  drawShape(ctx, el, path, st, dc);
}
