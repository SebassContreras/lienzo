import type { AnimState } from "../../engine/anim.ts";
import { fontString, textLayout } from "../../engine/geometry.ts";
import {
  type Ctx,
  dashFor,
  linearGradient,
  rgba,
  shadowOnly,
  withTransform,
} from "../../engine/paint.ts";
import type { DrawContext } from "../descriptor.ts";
import type { RectEl, ShapeEl } from "./descriptor.ts";

export function drawRect(
  ctx: Ctx,
  el: RectEl,
  st: AnimState,
  dc: DrawContext,
): void {
  const path = new Path2D();
  path.roundRect(
    el.x,
    el.y,
    el.w,
    el.h,
    Math.max(0, Math.min(el.radius, el.w / 2, el.h / 2)),
  );
  drawShape(ctx, el, path, st, dc);
}

/**
 * Paints a filled shape the way rectangles look: shadow, background glow, fill, border with
 * its glow and the inner label. `path` is the outline, in scene coordinates.
 */
export function drawShape(
  ctx: Ctx,
  el: ShapeEl,
  path: Path2D,
  st: AnimState,
  { scene, t }: DrawContext,
): void {
  const box = { x: el.x, y: el.y, w: el.w, h: el.h };
  withTransform(ctx, box, st, () => {
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
    if (el.bgGlow.enabled) {
      for (let i = 0; i < el.bgGlow.strength; i++) {
        shadowOnly(
          ctx,
          () => ctx.fill(path),
          el.bgGlow.color,
          el.bgGlow.blur * st.glowMul,
        );
      }
    }

    ctx.save();
    ctx.globalAlpha *= el.fill.opacity;
    ctx.fillStyle = el.fill.gradient
      ? linearGradient(ctx, box, el.fill.angle, el.fill.color, el.fill.color2)
      : el.fill.color;
    ctx.fill(path);
    ctx.restore();

    if (el.border.width > 0) {
      const dash = dashFor(el.border.style, el.border.width);
      const period = dash.reduce((a, b) => a + b, 0);
      const stroke = () => {
        ctx.lineWidth = el.border.width;
        ctx.lineCap = "round";
        ctx.setLineDash(dash);
        ctx.lineDashOffset = -(t / scene.duration) * el.border.flow * period;
        ctx.stroke(path);
      };
      if (el.borderGlow.enabled) {
        for (let i = 0; i < el.borderGlow.strength; i++) {
          shadowOnly(
            ctx,
            stroke,
            el.borderGlow.color,
            el.borderGlow.blur * st.glowMul,
          );
        }
      }
      ctx.save();
      ctx.strokeStyle = rgba(el.border.color, el.border.opacity);
      stroke();
      ctx.restore();
    }

    if (el.label.text) drawLabel(ctx, el);
  });
}

/** The rectangle's inner text, centred vertically. */
function drawLabel(ctx: Ctx, el: ShapeEl): void {
  const { label } = el;
  const layout = textLayout(label);
  ctx.save();
  ctx.font = fontString(label);
  ctx.letterSpacing = "0px";
  ctx.textBaseline = "top";
  ctx.fillStyle = label.color;
  const top = el.y + (el.h - layout.h) / 2;
  layout.lines.forEach((line, i) => {
    const lw = layout.widths[i] as number;
    const x =
      label.align === "left"
        ? el.x + label.padding
        : label.align === "center"
          ? el.x + (el.w - lw) / 2
          : el.x + el.w - label.padding - lw;
    const y = top + i * layout.lineStep + (layout.lineStep - label.size) / 2;
    ctx.fillText(line, x, y);
  });
  ctx.restore();
}
