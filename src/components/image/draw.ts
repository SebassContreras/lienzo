import type { AnimState } from "../../engine/anim.ts";
import { boxOf } from "../../engine/geometry.ts";
import { imageFor } from "../../engine/images.ts";
import {
  type Ctx,
  rgba,
  shadowOnly,
  withTransform,
} from "../../engine/paint.ts";
import type { ImageEl } from "./descriptor.ts";

export function drawImage(ctx: Ctx, el: ImageEl, st: AnimState): void {
  const box = boxOf(el);
  withTransform(ctx, box, st, () => {
    const path = new Path2D();
    path.roundRect(
      el.x,
      el.y,
      el.w,
      el.h,
      Math.max(0, Math.min(el.radius, el.w / 2, el.h / 2)),
    );
    if (el.shadow.enabled) {
      shadowOnly(
        ctx,
        () => ctx.fill(path),
        rgba(el.shadow.color, el.shadow.opacity),
        el.shadow.blur,
        el.shadow.x,
        el.shadow.y,
      );
    }

    const image = imageFor(el.src);
    ctx.save();
    ctx.globalAlpha *= el.opacity;
    ctx.clip(path);
    if (image) {
      ctx.drawImage(image, el.x, el.y, el.w, el.h);
    } else {
      drawPlaceholder(ctx, el);
    }
    ctx.restore();

    if (el.border.width > 0) {
      ctx.save();
      ctx.lineWidth = el.border.width;
      ctx.strokeStyle = rgba(el.border.color, el.border.opacity);
      ctx.stroke(path);
      ctx.restore();
    }
  });
}

/** Shown before a file is chosen (or while it loads): a soft box with a mountain glyph. */
function drawPlaceholder(ctx: Ctx, el: ImageEl): void {
  ctx.fillStyle = "rgba(148, 163, 184, 0.15)";
  ctx.fillRect(el.x, el.y, el.w, el.h);
  const s = Math.min(el.w, el.h) * 0.3;
  const cx = el.x + el.w / 2;
  const cy = el.y + el.h / 2;
  ctx.strokeStyle = "rgba(203, 213, 225, 0.6)";
  ctx.lineWidth = Math.max(1, s / 12);
  ctx.lineJoin = "round";
  ctx.strokeRect(cx - s, cy - s * 0.75, s * 2, s * 1.5);
  ctx.beginPath();
  ctx.moveTo(cx - s, cy + s * 0.5);
  ctx.lineTo(cx - s * 0.3, cy - s * 0.15);
  ctx.lineTo(cx + s * 0.2, cy + s * 0.3);
  ctx.lineTo(cx + s * 0.5, cy + s * 0.05);
  ctx.lineTo(cx + s, cy + s * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + s * 0.45, cy - s * 0.35, s * 0.15, 0, Math.PI * 2);
  ctx.stroke();
}
