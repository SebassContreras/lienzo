import type { AnimState } from "../../engine/anim.ts";
import { boxOf, fontString, type Pt } from "../../engine/geometry.ts";
import { type Ctx, shadowOnly, withTransform } from "../../engine/paint.ts";
import { linesOf } from "../../engine/reveal.ts";
import type { StepsEl } from "./descriptor.ts";

/** How lit step `i` (0-based) is at `active` steps, 0–1: step 1 lights as `active` goes 0→1. */
export const litness = (active: number, i: number): number =>
  Math.min(1, Math.max(0, active - i));

/** The centre of each of `n` steps along the element's axis. */
function stepCentres(el: StepsEl, n: number): Pt[] {
  const r = el.dot / 2;
  const across = el.layout === "horizontal";
  const len = (across ? el.w : el.h) - el.dot;
  return Array.from({ length: n }, (_, i) => {
    const along = r + (n > 1 ? (len * i) / (n - 1) : len / 2);
    return across
      ? { x: el.x + along, y: el.y + r }
      : { x: el.x + r, y: el.y + along };
  });
}

export function drawSteps(ctx: Ctx, el: StepsEl, st: AnimState): void {
  const labels = linesOf(el.labels);
  const n = labels.length;
  if (n === 0) return;
  const pts = stepCentres(el, n);
  const r = el.dot / 2;
  const across = el.layout === "horizontal";
  const glowing = (draw: () => void) => {
    if (!el.glow.enabled) return;
    for (let i = 0; i < el.glow.strength; i++)
      shadowOnly(ctx, draw, el.glow.color, el.glow.blur * st.glowMul);
  };
  withTransform(ctx, boxOf(el), st, () => {
    ctx.lineCap = "round";
    ctx.lineWidth = el.lineWidth;
    for (let i = 0; i + 1 < n; i++) {
      const a = pts[i] as Pt;
      const b = pts[i + 1] as Pt;
      ctx.strokeStyle = el.idle;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      // the segment fills while the next step lights
      const k = litness(el.active, i + 1);
      if (k <= 0) continue;
      const seg = () => {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k);
        ctx.stroke();
      };
      ctx.strokeStyle = el.color;
      glowing(seg);
      seg();
    }
    ctx.font = fontString({ ...el, text: "" });
    ctx.letterSpacing = "0px";
    labels.forEach((label, i) => {
      const p = pts[i] as Pt;
      const lit = litness(el.active, i);
      const disc = () => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      };
      ctx.fillStyle = el.idle;
      disc();
      if (lit > 0) {
        ctx.save();
        ctx.globalAlpha *= lit;
        ctx.fillStyle = el.color;
        glowing(disc);
        disc();
        ctx.restore();
      }
      ctx.fillStyle = el.numberColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), p.x, p.y);
      ctx.fillStyle = el.textColor;
      if (across) {
        ctx.textBaseline = "top";
        ctx.fillText(label, p.x, p.y + r + el.size * 0.6);
      } else {
        ctx.textAlign = "left";
        ctx.fillText(label, p.x + r + el.size * 0.8, p.y);
      }
    });
  });
}
