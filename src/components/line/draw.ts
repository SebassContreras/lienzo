import { animState, frac } from "../../engine/anim.ts";
import {
  type PathSamples,
  type Pt,
  partialPath,
  pointAtFraction,
  resolveLine,
  samplePath,
} from "../../engine/geometry.ts";
import {
  type Ctx,
  dashFor,
  rgba,
  shadowOnly,
  tracePolyline,
} from "../../engine/paint.ts";
import type { DrawContext } from "../descriptor.ts";
import type { LineEl } from "./descriptor.ts";

export function drawLine(
  ctx: Ctx,
  el: LineEl,
  { scene, t, byId }: DrawContext,
): void {
  const st = animState(el.anim, t, scene.duration);
  const s = samplePath(resolveLine(el, byId));
  if (s.total < 1) return;
  const progress = el.anim.kind === "draw" ? st.progress : 1;
  if (progress <= 0) return;
  const pts = partialPath(s, progress);

  ctx.save();
  ctx.globalAlpha *= st.alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = el.width;
  ctx.setLineDash(dashFor(el.style, el.width));

  const stroke = () => {
    tracePolyline(ctx, pts);
    ctx.stroke();
  };
  if (el.glow.enabled) {
    for (let i = 0; i < el.glow.strength; i++) {
      shadowOnly(ctx, stroke, el.glow.color, el.glow.blur);
    }
  }
  ctx.strokeStyle = rgba(el.color, el.opacity);
  stroke();
  ctx.setLineDash([]);

  const arrowSize = 8 + el.width * 2.5;
  ctx.fillStyle = rgba(el.color, Math.max(el.opacity, 0.9));
  if (el.arrowEnd) {
    const tip = pointAtFraction(s, progress);
    drawArrow(ctx, tip.p, tip.angle, arrowSize);
  }
  if (el.arrowStart) {
    const start = pointAtFraction(s, 0);
    drawArrow(ctx, start.p, start.angle + Math.PI, arrowSize);
  }

  drawFlow(ctx, el, s, pts, progress, t / scene.duration);
  ctx.restore();
}

function drawArrow(ctx: Ctx, p: Pt, angle: number, size: number): void {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(size * 0.4, 0);
  ctx.lineTo(-size, size * 0.65);
  ctx.lineTo(-size * 0.6, 0);
  ctx.lineTo(-size, -size * 0.65);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Pulses, marching ants or comets travelling along the visible part of the line. */
function drawFlow(
  ctx: Ctx,
  el: LineEl,
  s: PathSamples,
  pts: Pt[],
  progress: number,
  loopT: number,
): void {
  const { flow } = el;
  if (flow.kind === "none") return;
  const phase = loopT * flow.speed;
  const dir = flow.reverse ? -1 : 1;
  const k = Math.hypot(ctx.getTransform().a, ctx.getTransform().b);

  ctx.save();
  ctx.shadowColor = flow.color;
  ctx.strokeStyle = flow.color;
  ctx.fillStyle = flow.color;

  if (flow.kind === "ants") {
    const period = flow.size * 4;
    ctx.lineWidth = Math.max(1, el.width);
    ctx.shadowBlur = flow.size * 2 * k;
    ctx.setLineDash([flow.size * 2, flow.size * 2]);
    ctx.lineDashOffset = -dir * phase * period;
    tracePolyline(ctx, pts);
    ctx.stroke();
  } else {
    const count = Math.max(1, Math.round(flow.count));
    for (let i = 0; i < count; i++) {
      let head = frac(phase + i / count);
      if (dir < 0) head = 1 - head;
      if (flow.kind === "pulse") {
        if (head > progress) continue;
        const fade = Math.min(1, head * 12, (1 - head) * 12);
        const { p } = pointAtFraction(s, head);
        ctx.globalAlpha = fade;
        ctx.shadowBlur = flow.size * 4 * k;
        ctx.beginPath();
        ctx.arc(p.x, p.y, flow.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "#ffffff";
        ctx.arc(p.x, p.y, flow.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = flow.color;
      } else {
        const tail = 0.25;
        const steps = 24;
        ctx.lineCap = "round";
        ctx.shadowBlur = flow.size * 3 * k;
        for (let j = 0; j < steps; j++) {
          const f0 = j / steps;
          const f1 = (j + 1) / steps;
          const u0 = head - dir * tail * (1 - f0);
          const u1 = head - dir * tail * (1 - f1);
          if (u0 < 0 || u1 < 0 || u0 > progress || u1 > progress) continue;
          const p0 = pointAtFraction(s, u0).p;
          const p1 = pointAtFraction(s, u1).p;
          ctx.globalAlpha = f1 ** 1.6;
          ctx.lineWidth = flow.size * (0.3 + 0.7 * f1);
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }
      }
    }
  }
  ctx.restore();
}
