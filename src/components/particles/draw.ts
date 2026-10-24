import type { AnimState } from "../../engine/anim.ts";
import { boxOf } from "../../engine/geometry.ts";
import {
  type Ctx,
  rgba,
  shadowOnly,
  withTransform,
} from "../../engine/paint.ts";
import {
  hueOf,
  linkAlpha,
  looksOf,
  particlePositions,
  uniformLooks,
} from "../../engine/particle-field.ts";
import {
  dotSprite,
  type Sprite,
  spriteRes,
  templateSprite,
} from "../../engine/particle-sprite.ts";
import { twinkleAlphas } from "../../engine/particle-twinkle.ts";
import type { DrawContext } from "../descriptor.ts";
import type { ParticlesEl } from "./descriptor.ts";

/** Link opacities are rounded to this many steps so all lines draw in a few strokes. */
const ALPHA_STEPS = 16;

/** Points and the lines between close ones; no fill, so what is underneath shows through. */
export function drawParticles(
  ctx: Ctx,
  el: ParticlesEl,
  st: AnimState,
  { scene, t, drawElements }: DrawContext,
): void {
  const box = boxOf(el);
  const pos = particlePositions(el, t, scene.duration, marginOf(el));
  const n = pos.length / 2;
  if (n === 0) return;
  const twinkle = twinkleAlphas(el, t, scene.duration);

  withTransform(ctx, box, st, () => {
    ctx.translate(box.x, box.y);

    // links, bucketed by opacity: one path per bucket instead of one per pair
    const { distance } = el.link;
    if (el.link.width > 0 && el.link.opacity > 0 && distance > 0) {
      const links = alphaBuckets();
      const d2max = distance * distance;
      for (let i = 0; i < n; i++) {
        const xi = pos[i * 2] as number;
        const yi = pos[i * 2 + 1] as number;
        if (Number.isNaN(xi)) continue;
        for (let j = i + 1; j < n; j++) {
          const xj = pos[j * 2] as number;
          if (Number.isNaN(xj)) continue;
          const dx = xj - xi;
          const dy = (pos[j * 2 + 1] as number) - yi;
          const d2 = dx * dx + dy * dy;
          if (d2 >= d2max) continue;
          const path = links.at(linkAlpha(Math.sqrt(d2), distance, 1));
          path.moveTo(xi, yi);
          path.lineTo(xi + dx, yi + dy);
        }
      }
      ctx.lineWidth = el.link.width;
      ctx.lineCap = "round";
      links.each((path, a) => {
        ctx.strokeStyle = rgba(el.link.color, el.link.opacity * a);
        ctx.stroke(path);
      });
    }

    // points: a sprite at each one when they vary or a template is set, else the dots below
    const dotShows = el.dot.size > 0 && el.dot.opacity > 0;
    if (el.template || (dotShows && !uniformLooks(el.variation))) {
      drawSprites(
        ctx,
        el,
        pos,
        twinkle,
        t / (scene.duration || 1),
        (hue, res) =>
          el.template
            ? templateSprite(el.template, hue, res, scene, drawElements)
            : dotSprite(el.dot, glowAt(el, st), hue, res),
      );
    } else if (dotShows) {
      const r = el.dot.size / 2;
      if (!twinkle) {
        const dots = new Path2D();
        for (let i = 0; i < n; i++) addDot(dots, pos, i, r);
        paintDots(ctx, el, st, dots);
      } else {
        // twinkling dots, bucketed by opacity like the links (057/D7)
        const dots = alphaBuckets();
        for (let i = 0; i < n; i++) {
          addDot(dots.at(twinkle[i] as number), pos, i, r);
        }
        dots.each((path, a) => {
          ctx.save();
          ctx.globalAlpha *= a;
          paintDots(ctx, el, st, path);
          ctx.restore();
        });
      }
    }
  });
}

/** Paths grouped into `ALPHA_STEPS` opacity steps, so many items draw in a few calls. */
function alphaBuckets() {
  const paths: Path2D[] = [];
  return {
    /** The path for items of opacity `a`, 0–1. */
    at(a: number): Path2D {
      const k = Math.max(
        0,
        Math.min(ALPHA_STEPS - 1, Math.floor(a * ALPHA_STEPS)),
      );
      const path = paths[k] ?? new Path2D();
      paths[k] = path;
      return path;
    },
    /** Each path with its step's opacity. */
    each(fn: (path: Path2D, a: number) => void): void {
      paths.forEach((path, k) => {
        fn(path, (k + 0.5) / ALPHA_STEPS);
      });
    },
  };
}

/** Adds point `i` as a dot of radius `r`, unless it is off the box (`NaN`). */
function addDot(path: Path2D, pos: Float64Array, i: number, r: number): void {
  const x = pos[i * 2] as number;
  const y = pos[i * 2 + 1] as number;
  if (Number.isNaN(x)) return;
  path.moveTo(x + r, y);
  path.arc(x, y, r, 0, Math.PI * 2);
}

/** Dots with the field's glow under them. */
function paintDots(ctx: Ctx, el: ParticlesEl, st: AnimState, dots: Path2D) {
  if (el.glow.enabled) {
    const blur = el.glow.blur * st.glowMul;
    for (let i = 0; i < el.glow.strength; i++) {
      shadowOnly(ctx, () => ctx.fill(dots), el.glow.color, blur);
    }
  }
  ctx.fillStyle = rgba(el.dot.color, el.dot.opacity);
  ctx.fill(dots);
}

/** How far, px, a point may sit off the box and still show part of itself. */
function marginOf(el: ParticlesEl): number {
  const tpl = el.template as { w?: number; h?: number } | null;
  const size = tpl ? Math.max(tpl.w ?? 0, tpl.h ?? 0) : el.dot.size;
  return (size * Math.max(1, el.variation.sizeMin, el.variation.sizeMax)) / 2;
}

/** The field's glow as the animation leaves it, its blur rounded so breathing reuses sprites. */
function glowAt(el: ParticlesEl, st: AnimState): ParticlesEl["glow"] {
  return { ...el.glow, blur: Math.round(el.glow.blur * st.glowMul) };
}

/**
 * Each point as a sprite, scaled, turned and faded by its own look; `progress` is how far
 * into the loop `t` is, so spins close with it (A6). `twinkle` fades each point further.
 */
function drawSprites(
  ctx: Ctx,
  el: ParticlesEl,
  pos: Float64Array,
  twinkle: Float64Array | null,
  progress: number,
  spriteFor: (hue: number, res: number) => Sprite,
): void {
  const looks = looksOf(el);
  const res = spriteRes(
    ctx,
    Math.max(el.variation.sizeMin, el.variation.sizeMax),
  );
  const sprites: Sprite[] = [];
  const alpha = ctx.globalAlpha;
  for (let i = 0; i < looks.scale.length; i++) {
    if (Number.isNaN(pos[i * 2] as number)) continue;
    const k = looks.hue[i] as number;
    const sprite =
      sprites[k] ?? spriteFor(hueOf(k, el.variation.hueShift), res);
    sprites[k] = sprite;
    const s = looks.scale[i] as number;
    const turn = (looks.spin[i] as number) * (progress % 1) * Math.PI * 2;
    ctx.save();
    ctx.globalAlpha = alpha * (looks.alpha[i] as number) * (twinkle?.[i] ?? 1);
    ctx.translate(pos[i * 2] as number, pos[i * 2 + 1] as number);
    ctx.rotate((looks.angle[i] as number) + turn);
    ctx.scale(s, s);
    ctx.drawImage(
      sprite.image,
      -sprite.w / 2,
      -sprite.h / 2,
      sprite.w,
      sprite.h,
    );
    ctx.restore();
  }
}
