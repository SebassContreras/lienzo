import type { AnimState } from "../../engine/anim.ts";
import { type Box, fitToBox, type Pt } from "../../engine/geometry.ts";
import type { Ctx } from "../../engine/paint.ts";
import type { DrawContext } from "../descriptor.ts";
import { drawShape } from "../rect/draw.ts";
import type { PolygonEl } from "./descriptor.ts";

/**
 * `n` points around the ellipse inscribed in `box`, starting straight up; odd points sit at
 * `inner` times the radius (1 = a regular polygon, less = a star).
 */
export function radialPoints(box: Box, n: number, inner = 1): Pt[] {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const k = i % 2 === 1 ? inner : 1;
    return {
      x: cx + Math.cos(a) * (box.w / 2) * k,
      y: cy + Math.sin(a) * (box.h / 2) * k,
    };
  });
}

/** A closed outline through `pts`. */
export function closedPath(pts: Pt[]): Path2D {
  const path = new Path2D();
  pts.forEach((p, i) => {
    if (i === 0) path.moveTo(p.x, p.y);
    else path.lineTo(p.x, p.y);
  });
  path.closePath();
  return path;
}

/** A whole number of corners within 3–12, whatever the field holds mid-animation. */
export const cornerCount = (n: number): number =>
  Math.round(Math.min(12, Math.max(3, n)));

/** A polygon's corners: inscribed in its box, or stretched to span it (059/D2). */
export function polygonPoints(el: PolygonEl): Pt[] {
  const pts = radialPoints(el, cornerCount(el.sides));
  return el.fit === "box" ? fitToBox(pts, el) : pts;
}

export function drawPolygon(
  ctx: Ctx,
  el: PolygonEl,
  st: AnimState,
  dc: DrawContext,
): void {
  const path = closedPath(polygonPoints(el));
  drawShape(ctx, el, path, st, dc);
}
