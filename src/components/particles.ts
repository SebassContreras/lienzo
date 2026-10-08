import { animState } from "../engine/anim.ts";
import { boxOf } from "../engine/geometry.ts";
import { type Ctx, rgba, shadowOnly, withTransform } from "../engine/paint.ts";
import { linkAlpha, particlePositions } from "../engine/particle-field.ts";
import type { ParticlesEl, Scene } from "../model/model.ts";

/** Link opacities are rounded to this many steps so all lines draw in a few strokes. */
const ALPHA_STEPS = 16;

/** Points and the lines between close ones; no fill, so what is underneath shows through. */
export function drawParticles(
  ctx: Ctx,
  el: ParticlesEl,
  scene: Scene,
  t: number,
): void {
  const st = animState(el.anim, t, scene.duration);
  const box = boxOf(el);
  const pos = particlePositions(el, t, scene.duration);
  const n = pos.length / 2;
  if (n === 0) return;

  withTransform(ctx, box, st, () => {
    ctx.translate(box.x, box.y);

    // links, bucketed by opacity: one path per bucket instead of one per pair
    const { distance } = el.link;
    if (el.link.width > 0 && el.link.opacity > 0 && distance > 0) {
      const buckets: Path2D[] = [];
      const d2max = distance * distance;
      for (let i = 0; i < n; i++) {
        const xi = pos[i * 2] as number;
        const yi = pos[i * 2 + 1] as number;
        for (let j = i + 1; j < n; j++) {
          const dx = (pos[j * 2] as number) - xi;
          const dy = (pos[j * 2 + 1] as number) - yi;
          const d2 = dx * dx + dy * dy;
          if (d2 >= d2max) continue;
          const a = linkAlpha(Math.sqrt(d2), distance, 1);
          const k = Math.min(ALPHA_STEPS - 1, Math.floor(a * ALPHA_STEPS));
          const path = buckets[k] ?? new Path2D();
          buckets[k] = path;
          path.moveTo(xi, yi);
          path.lineTo(xi + dx, yi + dy);
        }
      }
      ctx.lineWidth = el.link.width;
      ctx.lineCap = "round";
      buckets.forEach((path, k) => {
        const a = el.link.opacity * ((k + 0.5) / ALPHA_STEPS);
        ctx.strokeStyle = rgba(el.link.color, a);
        ctx.stroke(path);
      });
    }

    // points
    if (el.dot.size > 0 && el.dot.opacity > 0) {
      const dots = new Path2D();
      const r = el.dot.size / 2;
      for (let i = 0; i < n; i++) {
        const x = pos[i * 2] as number;
        const y = pos[i * 2 + 1] as number;
        dots.moveTo(x + r, y);
        dots.arc(x, y, r, 0, Math.PI * 2);
      }
      if (el.glow.enabled) {
        const blur = el.glow.blur * st.glowMul;
        for (let i = 0; i < el.glow.strength; i++) {
          shadowOnly(ctx, () => ctx.fill(dots), el.glow.color, blur);
        }
      }
      ctx.fillStyle = rgba(el.dot.color, el.dot.opacity);
      ctx.fill(dots);
    }
  });
}
