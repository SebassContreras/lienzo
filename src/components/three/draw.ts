import type { AnimState } from "../../engine/anim.ts";
import { boxOf } from "../../engine/geometry.ts";
import { type Ctx, withTransform } from "../../engine/paint.ts";
import type { DrawContext } from "../descriptor.ts";
import type { ThreeEl } from "./descriptor.ts";
import { threeRuntime } from "./lazy.ts";

export function drawThree(
  ctx: Ctx,
  el: ThreeEl,
  st: AnimState,
  dc: DrawContext,
): void {
  withTransform(ctx, boxOf(el), st, () => {
    const picture = threeRuntime
      .get()
      ?.renderThree(el, dc.t, dc.scene.duration);
    if (picture) ctx.drawImage(picture, el.x, el.y, el.w, el.h);
    else drawPlaceholder(ctx, el);
  });
}

/** Shown while the model or font loads, or where WebGL is missing: a soft box. */
function drawPlaceholder(ctx: Ctx, el: ThreeEl): void {
  ctx.save();
  ctx.fillStyle = "rgba(148, 163, 184, 0.12)";
  ctx.fillRect(el.x, el.y, el.w, el.h);
  ctx.strokeStyle = "rgba(203, 213, 225, 0.5)";
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(el.x, el.y, el.w, el.h);
  ctx.restore();
}
