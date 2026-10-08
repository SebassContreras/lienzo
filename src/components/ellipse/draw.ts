import type { AnimState } from "../../engine/anim.ts";
import type { Ctx } from "../../engine/paint.ts";
import type { DrawContext } from "../descriptor.ts";
import { drawShape } from "../rect/draw.ts";
import type { EllipseEl } from "./descriptor.ts";

export function drawEllipse(
  ctx: Ctx,
  el: EllipseEl,
  st: AnimState,
  dc: DrawContext,
): void {
  const path = new Path2D();
  path.ellipse(
    el.x + el.w / 2,
    el.y + el.h / 2,
    Math.max(0, el.w / 2),
    Math.max(0, el.h / 2),
    0,
    0,
    Math.PI * 2,
  );
  drawShape(ctx, el, path, st, dc);
}
