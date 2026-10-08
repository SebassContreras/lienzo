import type { AnimState } from "../../engine/anim.ts";
import { fontString, textLayout } from "../../engine/geometry.ts";
import {
  type Ctx,
  linearGradient,
  shadowOnly,
  withTransform,
} from "../../engine/paint.ts";
import type { TextEl } from "./descriptor.ts";

export function drawText(ctx: Ctx, el: TextEl, st: AnimState): void {
  const layout = textLayout(el);
  const box = { x: el.x, y: el.y, w: layout.w, h: layout.h };
  withTransform(ctx, box, st, () => {
    ctx.font = fontString(el);
    ctx.letterSpacing = `${el.letterSpacing}px`;
    ctx.textBaseline = "top";
    const paint = () => {
      layout.lines.forEach((line, i) => {
        const lw = layout.widths[i] as number;
        const x =
          el.align === "left"
            ? el.x
            : el.align === "center"
              ? el.x + (layout.w - lw) / 2
              : el.x + layout.w - lw;
        const y = el.y + i * layout.lineStep + (layout.lineStep - el.size) / 2;
        ctx.fillText(line, x, y);
      });
    };
    if (el.glow.enabled) {
      for (let i = 0; i < el.glow.strength; i++) {
        shadowOnly(ctx, paint, el.glow.color, el.glow.blur * st.glowMul);
      }
    }
    ctx.globalAlpha *= el.opacity;
    ctx.fillStyle = el.gradient
      ? linearGradient(ctx, box, 0, el.color, el.color2)
      : el.color;
    paint();
  });
}
