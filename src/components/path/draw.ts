import type { AnimState } from "../../engine/anim.ts";
import { EASINGS, easingFn } from "../../engine/easing.ts";
import {
  type Ctx,
  dashFor,
  linearGradient,
  rgba,
  shadowOnly,
  withTransform,
} from "../../engine/paint.ts";
import { lengthOf, morphPairs, subpathsOf } from "../../engine/path/cache.ts";
import {
  interpolate,
  mixStyle,
  type ShapeStyle,
  spanAt,
} from "../../engine/path/morph.ts";
import { type Points, polylineLength } from "../../engine/path/morph-prep.ts";
import type { Subpath } from "../../engine/path/parse.ts";
import type { DrawContext } from "../descriptor.ts";
import type { PathEl, PathShape } from "./descriptor.ts";

/** How a shape is named in errors: "Forma 1", "Forma 2"… */
export const shapeName = (i: number) => `Forma ${i + 1}`;

/** Path coordinates (in the view box) to scene coordinates (in the element's box). */
type Map2 = (x: number, y: number) => [number, number];

function mapOf(el: PathEl): { map: Map2; sx: number; sy: number } {
  const sx = el.w / el.view.w;
  const sy = el.h / el.view.h;
  return {
    sx,
    sy,
    map: (x, y) => [el.x + (x - el.view.x) * sx, el.y + (y - el.view.y) * sy],
  };
}

function cubicsPath(subs: Subpath[], map: Map2): Path2D {
  const p = new Path2D();
  for (const { curves, closed } of subs) {
    const c0 = curves[0];
    if (!c0) continue;
    p.moveTo(...map(c0[0], c0[1]));
    for (const c of curves)
      p.bezierCurveTo(
        ...map(c[2], c[3]),
        ...map(c[4], c[5]),
        ...map(c[6], c[7]),
      );
    if (closed) p.closePath();
  }
  return p;
}

function styleOf(el: PathEl, s: PathShape): ShapeStyle {
  return {
    fill: s.fill ?? el.fill.color,
    stroke: s.stroke ?? el.border.color,
    opacity: s.opacity ?? 1,
    width: s.width ?? el.border.width,
  };
}

type Frame = { path: Path2D; length: number; style: ShapeStyle };

/** One shape of the list as it is, drawn from its own curves. */
function shapeFrame(el: PathEl, i: number): Frame {
  const shape = el.shapes[i] as PathShape;
  const { map, sx, sy } = mapOf(el);
  return {
    path: cubicsPath(subpathsOf(shape.d, shapeName(i)), map),
    length: lengthOf(shape.d, shapeName(i), sx, sy),
    style: styleOf(el, shape),
  };
}

/**
 * What `el` shows at its `morph` value: a shape of the list, or an in-between frame
 * interpolated from cached prepared points (024/D6, D7). Undefined while a shape is not a
 * valid path (only scenes edited by hand get there: the inspector rejects them, R10).
 */
export function frameOf(el: PathEl): Frame | undefined {
  try {
    const ease = easingFn(el.morphEasing, EASINGS["ease-in-out"]);
    const { i, k } = spanAt(el.morph, el.shapes.length, ease);
    if (k <= 0) return shapeFrame(el, i);
    if (k >= 1) return shapeFrame(el, i + 1);
    const from = el.shapes[i] as PathShape;
    const to = el.shapes[i + 1] as PathShape;
    const pairs = morphPairs(from.d, to.d, [shapeName(i), shapeName(i + 1)]);
    const { map } = mapOf(el);
    const path = new Path2D();
    let length = 0;
    for (const ring of interpolate(pairs, k)) {
      const pts: Points = [];
      for (let j = 0; j < ring.pts.length; j += 2)
        pts.push(...map(ring.pts[j] as number, ring.pts[j + 1] as number));
      length += polylineLength(pts, ring.closed);
      path.moveTo(pts[0] as number, pts[1] as number);
      for (let j = 2; j < pts.length; j += 2)
        path.lineTo(pts[j] as number, pts[j + 1] as number);
      if (ring.closed) path.closePath();
    }
    return {
      path,
      length,
      style: mixStyle(styleOf(el, from), styleOf(el, to), k),
    };
  } catch {
    return undefined;
  }
}

/**
 * What `el` draws: in "layers" mode every shape that parses, stacked in list order (057/D2);
 * otherwise the one frame at its `morph` value.
 */
function framesOf(el: PathEl): Frame[] {
  if (el.mode !== "layers") {
    const frame = frameOf(el);
    return frame ? [frame] : [];
  }
  return el.shapes.flatMap((_, i) => {
    try {
      return [shapeFrame(el, i)];
    } catch {
      return [];
    }
  });
}

/**
 * A free path: shadow, fill, then the stroke with its glow, per frame. The stroke is revealed
 * up to `progress` (times the "draw" entrance's), and the fill fades in with it (024/D2).
 */
export function drawPath(
  ctx: Ctx,
  el: PathEl,
  st: AnimState,
  { scene, t }: DrawContext,
): void {
  const frames = framesOf(el);
  if (frames.length === 0) return;
  const shown = Math.max(0, Math.min(1, el.progress * st.progress));
  if (shown <= 0) return;
  const box = { x: el.x, y: el.y, w: el.w, h: el.h };
  const flow = (t / scene.duration) * el.border.flow;
  withTransform(ctx, box, st, () => {
    // a lone frame paints straight into the transform, with the same canvas calls as before 057
    const [only] = frames;
    if (only && frames.length === 1) {
      paintFrame(ctx, el, only, shown, flow, st.glowMul);
      return;
    }
    for (const frame of frames) {
      ctx.save();
      paintFrame(ctx, el, frame, shown, flow, st.glowMul);
      ctx.restore();
    }
  });
}

/** One frame inside the element's transform; `flow` is how far the dashes have run. */
function paintFrame(
  ctx: Ctx,
  el: PathEl,
  { path, length, style }: Frame,
  shown: number,
  flow: number,
  glowMul: number,
): void {
  const box = { x: el.x, y: el.y, w: el.w, h: el.h };
  ctx.globalAlpha *= style.opacity;
  if (el.shadow.enabled) {
    shadowOnly(
      ctx,
      () => ctx.fill(path),
      rgba(el.shadow.color, el.shadow.opacity * shown),
      el.shadow.blur,
      el.shadow.x,
      el.shadow.y,
    );
  }

  ctx.save();
  ctx.globalAlpha *= el.fill.opacity * shown;
  ctx.fillStyle = el.fill.gradient
    ? linearGradient(ctx, box, el.fill.angle, style.fill, el.fill.color2)
    : style.fill;
  ctx.fill(path);
  ctx.restore();

  if (style.width <= 0) return;
  const dash =
    shown < 1
      ? [length * shown, length + 1]
      : dashFor(el.border.style, style.width);
  const period = dash.reduce((a, b) => a + b, 0);
  const stroke = () => {
    ctx.lineWidth = style.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash(dash);
    ctx.lineDashOffset = shown < 1 ? 0 : -flow * period;
    ctx.stroke(path);
  };
  if (el.borderGlow.enabled) {
    for (let i = 0; i < el.borderGlow.strength; i++) {
      shadowOnly(
        ctx,
        stroke,
        el.borderGlow.color,
        el.borderGlow.blur * glowMul,
      );
    }
  }
  ctx.save();
  ctx.strokeStyle = rgba(style.stroke, el.border.opacity);
  stroke();
  ctx.restore();
}
