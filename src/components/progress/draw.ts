import type { AnimState } from "../../engine/anim.ts";
import { boxOf, fontString } from "../../engine/geometry.ts";
import {
  type Ctx,
  linearGradient,
  shadowOnly,
  withTransform,
} from "../../engine/paint.ts";
import type { ProgressEl } from "./descriptor.ts";

/** `value` as a fraction of the whole, within 0–1. */
export const fractionOf = (value: number): number =>
  Math.min(1, Math.max(0, value / 100));

export function drawProgress(ctx: Ctx, el: ProgressEl, st: AnimState): void {
  const box = boxOf(el);
  const k = fractionOf(el.value);
  const paint = el.gradient
    ? linearGradient(ctx, box, 0, el.color, el.color2)
    : el.color;
  const glowing = (draw: () => void) => {
    if (!el.glow.enabled) return;
    for (let i = 0; i < el.glow.strength; i++) {
      shadowOnly(ctx, draw, el.glow.color, el.glow.blur * st.glowMul);
    }
  };
  withTransform(ctx, box, st, () => {
    if (el.style === "bar") {
      const r = el.rounded ? el.h / 2 : 0;
      const track = new Path2D();
      track.roundRect(el.x, el.y, el.w, el.h, r);
      ctx.fillStyle = el.track;
      ctx.fill(track);
      if (k <= 0) return;
      const bar = new Path2D();
      bar.roundRect(el.x, el.y, Math.max(el.w * k, r * 2), el.h, r);
      glowing(() => ctx.fill(bar));
      ctx.fillStyle = paint;
      ctx.fill(bar);
      return;
    }
    const cx = el.x + el.w / 2;
    const cy = el.y + el.h / 2;
    const radius = Math.max(1, Math.min(el.w, el.h) / 2 - el.thickness / 2);
    const start = -Math.PI / 2;
    ctx.lineWidth = el.thickness;
    ctx.lineCap = el.rounded ? "round" : "butt";
    ctx.strokeStyle = el.track;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    if (k > 0) {
      const arc = () => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, start, start + k * Math.PI * 2);
        ctx.stroke();
      };
      glowing(arc);
      ctx.strokeStyle = paint;
      arc();
    }
    if (el.showNumber) {
      ctx.font = fontString({ ...el, text: "" });
      ctx.letterSpacing = "0px";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = el.numberColor;
      ctx.fillText(`${Math.round(el.value)}${el.suffix}`, cx, cy);
    }
  });
}
