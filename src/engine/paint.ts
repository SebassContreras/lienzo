import type { StrokeStyle } from "../model/model.ts";
import type { AnimState } from "./anim.ts";
import { clamp01 } from "./anim.ts";
import type { Box, Pt } from "./geometry.ts";

export type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** The red, green and blue (0–255) of a `#rgb` or `#rrggbb` color. */
function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** The color `k` (0–1) of the way from `a` to `b`, as `#rrggbb`. */
export function mixColor(a: string, b: string, k: number): string {
  const ca = hexRgb(a);
  const cb = hexRgb(b);
  const hex = ca.map((v, i) =>
    Math.round(v + ((cb[i] as number) - v) * k)
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${hex.join("")}`;
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha)})`;
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
  // the off-canvas shift, as it lands on the device once rotated or skewed (018/D7)
  ctx.shadowOffsetX = OFF * m.a + ox * k;
  ctx.shadowOffsetY = OFF * m.b + oy * k;
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

const RAD = Math.PI / 180;

/**
 * Runs `draw` with the animation's transform applied around the box centre, in one fixed
 * order as CSS `transform` would read it: translate, rotate, skew, scale; then alpha.
 */
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
  if (st.rotate) ctx.rotate(st.rotate * RAD);
  if (st.skewX || st.skewY)
    ctx.transform(
      1,
      Math.tan(st.skewY * RAD),
      Math.tan(st.skewX * RAD),
      1,
      0,
      0,
    );
  ctx.scale(st.scale * st.scaleX, st.scale * st.scaleY);
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
