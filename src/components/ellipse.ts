import type { Ctx } from "../engine/paint.ts";
import type { EllipseEl, Scene } from "../model/model.ts";
import { drawShape } from "./rect/draw.ts";

export function drawEllipse(
  ctx: Ctx,
  el: EllipseEl,
  scene: Scene,
  t: number,
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
  drawShape(ctx, el, path, {
    scene,
    t,
    byId: new Map(),
    drawElements: () => {},
  });
}
