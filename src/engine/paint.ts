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

/** A gradient color stop: `color` at fraction `at` (0–1) of the way. */
export type Stop = { at: number; color: string };

/** What a gradient fill needs: two colors, or its own `stops` (059/D4). */
export type GradientFill = {
  type?: "linear" | "radial";
  angle: number;
  color: string;
  color2: string;
  stops?: Stop[];
};

/** A fill's stops in the order given, or `color` → `color2` when it has none (059/D5). */
export function gradientStops(fill: GradientFill): Stop[] {
  return (
    fill.stops ?? [
      { at: 0, color: fill.color },
      { at: 1, color: fill.color2 },
    ]
  );
}

/**
 * How far a radial gradient reaches: the box's farthest corner, like CSS's default (059/D5),
 * or the edge of a shape inscribed in the box, such as a circle, so its last color shows (067/D1).
 */
export type GradientReach = "corner" | "edge";

/**
 * A linear gradient across `box` at `angleDeg` (0 = left to right), or a radial one from the
 * box centre out to `reach`, through `stops`.
 */
function gradientAcross(
  ctx: Ctx,
  box: Box,
  type: "linear" | "radial",
  angleDeg: number,
  stops: Stop[],
  reach: GradientReach = "corner",
): CanvasGradient {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  let g: CanvasGradient;
  if (type === "radial") {
    g = ctx.createRadialGradient(
      cx,
      cy,
      0,
      cx,
      cy,
      reach === "edge"
        ? Math.max(box.w, box.h) / 2
        : Math.hypot(box.w, box.h) / 2,
    );
  } else {
    const a = (angleDeg * Math.PI) / 180;
    const r =
      Math.abs((box.w / 2) * Math.cos(a)) + Math.abs((box.h / 2) * Math.sin(a));
    g = ctx.createLinearGradient(
      cx - Math.cos(a) * r,
      cy - Math.sin(a) * r,
      cx + Math.cos(a) * r,
      cy + Math.sin(a) * r,
    );
  }
  for (const s of stops) g.addColorStop(s.at, s.color);
  return g;
}

/** A fill's gradient across `box`: linear or radial, two colors or its own stops. */
export function fillGradient(
  ctx: Ctx,
  box: Box,
  fill: GradientFill,
  reach: GradientReach = "corner",
): CanvasGradient {
  return gradientAcross(
    ctx,
    box,
    fill.type ?? "linear",
    fill.angle,
    gradientStops(fill),
    reach,
  );
}

/** A two-color gradient across `box` at `angleDeg` (0 = left to right). */
export function linearGradient(
  ctx: Ctx,
  box: Box,
  angleDeg: number,
  c1: string,
  c2: string,
): CanvasGradient {
  return gradientAcross(ctx, box, "linear", angleDeg, [
    { at: 0, color: c1 },
    { at: 1, color: c2 },
  ]);
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
 * Runs `draw` with the animation's transform applied around the transform origin (`st.originX`,
 * `st.originY` in box fractions, default 0.5 = box centre), in one fixed order as CSS `transform`
 * would read it: translate, rotate, skew, scale; then alpha.
 */
export function withTransform(
  ctx: Ctx,
  box: Box,
  st: AnimState,
  draw: () => void,
): void {
  const ox = box.x + box.w * (st.originX ?? 0.5);
  const oy = box.y + box.h * (st.originY ?? 0.5);
  ctx.save();
  ctx.globalAlpha *= st.alpha;
  ctx.translate(ox + st.dx, oy + st.dy);
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
  ctx.translate(-ox, -oy);
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
