import type { StrokeStyle } from "../model/model.ts";
import type { AnimState } from "./anim.ts";
import { clamp01 } from "./anim.ts";
import type { Box, Pt } from "./geometry.ts";

export type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${clamp01(alpha)})`;
}

/** A two-color gradient across `box` at `angleDeg` (0 = left to right). */
export function linearGradient(
  ctx: Ctx,
  box: Box,
  angleDeg: number,
  c1: string,
  c2: string,
): CanvasGradient {
  const a = (angleDeg * Math.PI) / 180;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const r =
    Math.abs((box.w / 2) * Math.cos(a)) + Math.abs((box.h / 2) * Math.sin(a));
  const g = ctx.createLinearGradient(
    cx - Math.cos(a) * r,
    cy - Math.sin(a) * r,
    cx + Math.cos(a) * r,
    cy + Math.sin(a) * r,
  );
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  return g;
}

/**
 * Paints only the shadow of `paint` (the shape itself is drawn far off-canvas). This gives glows
 * and drop shadows whose strength does not depend on the shape's own fill opacity.
 */
export function shadowOnly(
  ctx: Ctx,
  paint: () => void,
  color: string,
  blur: number,
  ox = 0,
  oy = 0,
): void {
  const m = ctx.getTransform();
  const k = Math.hypot(m.a, m.b);
  const OFF = 20000;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * k;
  ctx.shadowOffsetX = (OFF + ox) * k;
  ctx.shadowOffsetY = oy * k;
  ctx.translate(-OFF, 0);
  ctx.fillStyle = "#000";
  ctx.strokeStyle = "#000";
  paint();
  ctx.restore();
}

export function dashFor(style: StrokeStyle, width: number): number[] {
  if (style === "dashed") return [width * 4, width * 3];
  if (style === "dotted") return [0.01, width * 2.4];
  return [];
}

/** Runs `draw` with the animation's offset, scale (around the box centre) and alpha applied. */
export function withTransform(
  ctx: Ctx,
  box: Box,
  st: AnimState,
  draw: () => void,
): void {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  ctx.save();
  ctx.globalAlpha *= st.alpha;
  ctx.translate(cx + st.dx, cy + st.dy);
  ctx.scale(st.scale, st.scale);
  ctx.translate(-cx, -cy);
  draw();
  ctx.restore();
}

export function tracePolyline(ctx: Ctx, pts: Pt[]): void {
  ctx.beginPath();
  pts.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
}
