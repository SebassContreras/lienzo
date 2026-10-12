import type { AnimState } from "../../engine/anim.ts";
import { fontString } from "../../engine/geometry.ts";
import { iconPaths } from "../../engine/icon-shapes.ts";
import {
  type Ctx,
  dashFor,
  linearGradient,
  rgba,
  shadowOnly,
  withTransform,
} from "../../engine/paint.ts";
import type { DrawContext } from "../descriptor.ts";
import type { BadgeEl } from "./descriptor.ts";
import { badgeLayout } from "./layout.ts";

/** Lucide draws on a 24×24 grid. */
const GRID = 24;

export function drawBadge(
  ctx: Ctx,
  el: BadgeEl,
  st: AnimState,
  { scene, t }: DrawContext,
): void {
  const lay = badgeLayout(el);
  const box = { x: el.x, y: el.y, w: lay.w, h: lay.h };
  const pill = new Path2D();
  pill.roundRect(box.x, box.y, box.w, box.h, box.h / 2);
  withTransform(ctx, box, st, () => {
    if (el.glow.enabled) {
      for (let i = 0; i < el.glow.strength; i++) {
        shadowOnly(
          ctx,
          () => ctx.fill(pill),
          el.glow.color,
          el.glow.blur * st.glowMul,
        );
      }
    }
    ctx.save();
    ctx.globalAlpha *= el.fill.opacity;
    ctx.fillStyle = el.fill.gradient
      ? linearGradient(ctx, box, el.fill.angle, el.fill.color, el.fill.color2)
      : el.fill.color;
    ctx.fill(pill);
    ctx.restore();

    if (el.border.width > 0) {
      const dash = dashFor(el.border.style, el.border.width);
      const period = dash.reduce((a, b) => a + b, 0);
      ctx.save();
      ctx.lineWidth = el.border.width;
      ctx.setLineDash(dash);
      ctx.lineDashOffset = -(t / scene.duration) * el.border.flow * period;
      ctx.strokeStyle = rgba(el.border.color, el.border.opacity);
      ctx.stroke(pill);
      ctx.restore();
    }

    const mid = box.y + box.h / 2;
    if (el.showIcon) {
      const k = lay.iconSize / GRID;
      ctx.save();
      ctx.translate(box.x + lay.iconX, mid - lay.iconSize / 2);
      ctx.scale(k, k);
      ctx.lineWidth = 2.25;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = el.color;
      for (const p of iconPaths(el.icon)) ctx.stroke(p);
      ctx.restore();
    }
    if (el.text) {
      ctx.font = fontString(el);
      ctx.letterSpacing = "0px";
      ctx.textBaseline = "middle";
      ctx.fillStyle = el.color;
      ctx.fillText(el.text, box.x + lay.textX, mid);
    }
  });
}
