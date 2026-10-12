import type { AnimState } from "../../engine/anim.ts";
import type { Ctx } from "../../engine/paint.ts";
import type { DrawContext } from "../descriptor.ts";
import { closedPath, cornerCount, radialPoints } from "../polygon/draw.ts";
import { drawShape } from "../rect/draw.ts";
import type { StarEl } from "./descriptor.ts";

export function drawStar(
  ctx: Ctx,
  el: StarEl,
  st: AnimState,
  dc: DrawContext,
): void {
  const n = cornerCount(el.points) * 2;
  drawShape(ctx, el, closedPath(radialPoints(el, n, el.inner)), st, dc);
}
