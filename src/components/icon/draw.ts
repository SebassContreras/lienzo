import type { AnimState } from "../../engine/anim.ts";
import { boxOf } from "../../engine/geometry.ts";
import { iconPaths } from "../../engine/icon-shapes.ts";
import {
  type Ctx,
  linearGradient,
  shadowOnly,
  withTransform,
} from "../../engine/paint.ts";
import type { IconEl } from "./descriptor.ts";

/** Lucide draws on a 24×24 grid. */
const GRID = 24;

export function drawIcon(ctx: Ctx, el: IconEl, st: AnimState): void {
  const box = boxOf(el);
  withTransform(ctx, box, st, () => {
    const { tile } = el;
    if (tile.enabled) {
      const path = new Path2D();
      path.roundRect(
        el.x,
        el.y,
        el.w,
        el.h,
        Math.max(0, Math.min(tile.radius, el.w / 2, el.h / 2)),
      );
      ctx.save();
      ctx.globalAlpha *= tile.opacity;
      ctx.fillStyle = tile.gradient
        ? linearGradient(ctx, box, tile.angle, tile.color, tile.color2)
        : tile.color;
      ctx.fill(path);
      ctx.restore();
    }

    const pad = tile.enabled ? tile.padding : 0;
    const size = Math.max(1, Math.min(el.w, el.h) - pad * 2);
    const k = size / GRID;
    const paths = iconPaths(el.icon);
    ctx.save();
    ctx.translate(el.x + (el.w - size) / 2, el.y + (el.h - size) / 2);
    ctx.scale(k, k);
    ctx.lineWidth = el.stroke;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const stroke = () => {
      for (const p of paths) ctx.stroke(p);
    };
    if (el.glow.enabled) {
      for (let i = 0; i < el.glow.strength; i++) {
        shadowOnly(ctx, stroke, el.glow.color, el.glow.blur * st.glowMul);
      }
    }
    ctx.globalAlpha *= el.opacity;
    ctx.strokeStyle = el.color;
    stroke();
    ctx.restore();
  });
}
