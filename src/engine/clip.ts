import { arrowPoints } from "../components/arrow/draw.ts";
import { badgeLayout } from "../components/badge/layout.ts";
import { frameOf } from "../components/path/draw.ts";
import {
  closedPath,
  cornerCount,
  polygonPoints,
  radialPoints,
} from "../components/polygon/draw.ts";
import type { Element } from "../model/model.ts";
import type { AnimState } from "./anim.ts";
import { type Box, boxOf } from "./geometry.ts";
import type { Ctx } from "./paint.ts";

const RAD = Math.PI / 180;

/**
 * Runs `draw` with everything it paints clipped to `path` (017/D4): a window's body clips its
 * children; 025's mask clips an element to another shape.
 */
export function withClip(ctx: Ctx, path: Path2D, draw: () => void): void {
  ctx.save();
  ctx.clip(path);
  draw();
  ctx.restore();
}

/**
 * Returns the un-transformed Path2D outline of an element (in its untransformed coordinates).
 */
function outlineOf(el: Element): Path2D {
  const path = new Path2D();
  switch (el.kind) {
    case "rect": {
      const w = el.w;
      const h = el.h;
      const r = Math.max(0, Math.min(el.radius, w / 2, h / 2));
      path.roundRect(el.x, el.y, w, h, r);
      return path;
    }
    case "ellipse": {
      path.ellipse(
        el.x + el.w / 2,
        el.y + el.h / 2,
        Math.max(0, el.w / 2),
        Math.max(0, el.h / 2),
        0,
        0,
        Math.PI * 2,
      );
      return path;
    }
    case "polygon": {
      return closedPath(polygonPoints(el));
    }
    case "star": {
      const n = cornerCount(el.points) * 2;
      return closedPath(radialPoints(el, n, el.inner));
    }
    case "arrow": {
      return closedPath(arrowPoints(el, el.direction, el.head, el.shaft));
    }
    case "badge": {
      const lay = badgeLayout(el);
      path.roundRect(el.x, el.y, lay.w, lay.h, lay.h / 2);
      return path;
    }
    case "table": {
      path.roundRect(el.x, el.y, el.w, el.h, Math.min(el.radius, el.h / 2));
      return path;
    }
    case "path": {
      const frame = frameOf(el);
      if (frame) return frame.path;
      const b = boxOf(el);
      path.rect(b.x, b.y, b.w, b.h);
      return path;
    }
    default: {
      const b = boxOf(el);
      path.rect(b.x, b.y, b.w, b.h);
      return path;
    }
  }
}

/**
 * Applies an element's animation transform to the context matrix without saving/restoring.
 */
function applyTransform(ctx: Ctx, box: Box, st: AnimState): void {
  const ox = box.x + box.w * (st.originX ?? 0.5);
  const oy = box.y + box.h * (st.originY ?? 0.5);
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
}

/**
 * Runs `draw` clipped to the mask element's outline, applying the mask's transform (025/D2).
 */
export function withMask(
  ctx: Ctx,
  maskEl: Element,
  maskTransform: AnimState,
  draw: () => void,
): void {
  const path = outlineOf(maskEl);
  const box = boxOf(maskEl);
  ctx.save();
  // Transform context to mask coordinates, clip, then reset transform back to identity
  // (or previous matrix) while preserving the clip in device/canvas space!
  const prevMatrix = ctx.getTransform?.();
  applyTransform(ctx, box, maskTransform);
  ctx.clip(path);
  if (prevMatrix && ctx.setTransform) {
    ctx.setTransform(prevMatrix);
  }
  draw();
  ctx.restore();
}
