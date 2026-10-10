/**
 * A particle template drawn once into an offscreen bitmap (a sprite), so a field of 300
 * points costs 300 `drawImage` calls instead of 300 full element draws (014/D5).
 */
import { descriptorOf } from "../components/index.ts";
import type { Element, Scene } from "../model/model.ts";
import { boxOf } from "./geometry.ts";
import { imageFor } from "./images.ts";
import type { Ctx } from "./paint.ts";

export type Sprite = {
  image: OffscreenCanvas;
  /** Size in template px; the bitmap itself is `res` times larger. */
  w: number;
  h: number;
};

type DrawElements = (
  ctx: Ctx,
  elements: Element[],
  scene: Scene,
  t: number,
) => void;

const cache = new Map<string, Sprite>();
const MAX_CACHED = 32;

/** The element with its animation, and its children's, set to none: a template is drawn still. */
function still(el: Element): Element {
  const anim = descriptorOf(el.kind)?.fields.anim;
  const copy = (
    anim && anim.type !== "widget"
      ? { ...el, anim: structuredClone(anim.default) }
      : { ...el }
  ) as Element;
  if (copy.kind === "group") copy.children = copy.children.map(still);
  return copy;
}

/** False while an image inside the template is still loading: its sprite must not be kept. */
function imagesReady(el: Element): boolean {
  if (el.kind === "image") return !el.src || imageFor(el.src) !== undefined;
  if (el.kind === "group") return el.children.every(imagesReady);
  return true;
}

/**
 * Rotates hues in place with the matrix CSS `hue-rotate()` uses, so a variant looks the same
 * in every browser (canvas `filter` is not supported everywhere).
 */
function hueRotate(data: Uint8ClampedArray, deg: number): void {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const m = [
    0.213 + c * 0.787 - s * 0.213,
    0.715 - c * 0.715 - s * 0.715,
    0.072 - c * 0.072 + s * 0.928,
    0.213 - c * 0.213 + s * 0.143,
    0.715 + c * 0.285 + s * 0.14,
    0.072 - c * 0.072 - s * 0.283,
    0.213 - c * 0.213 - s * 0.787,
    0.715 - c * 0.715 + s * 0.715,
    0.072 + c * 0.928 + s * 0.072,
  ] as const;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] as number;
    const g = data[i + 1] as number;
    const b = data[i + 2] as number;
    data[i] = m[0] * r + m[1] * g + m[2] * b;
    data[i + 1] = m[3] * r + m[4] * g + m[5] * b;
    data[i + 2] = m[6] * r + m[7] * g + m[8] * b;
  }
}

/**
 * The template drawn centred in a bitmap `res` times its size, its hues turned by `hue`
 * degrees. Room is left around the box for strokes, glows and shadows. Cached by the
 * template's JSON, `hue` and `res`.
 */
export function spriteOf(
  template: Element,
  hue: number,
  res: number,
  scene: Scene,
  drawElements: DrawElements,
): Sprite {
  const ready = imagesReady(template);
  const key = `${JSON.stringify(template)}|${hue}|${res}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const box = boxOf(template);
  const pad = Math.ceil(Math.max(box.w, box.h) * 0.25 + 40);
  const w = box.w + pad * 2;
  const h = box.h + pad * 2;
  const image = new OffscreenCanvas(
    Math.max(1, Math.ceil(w * res)),
    Math.max(1, Math.ceil(h * res)),
  );
  const ctx = image.getContext("2d") as OffscreenCanvasRenderingContext2D;
  ctx.scale(res, res);
  ctx.translate(pad - box.x, pad - box.y);
  drawElements(ctx, [still(template)], scene, 0);
  if (hue % 360 !== 0) {
    const pixels = ctx.getImageData(0, 0, image.width, image.height);
    hueRotate(pixels.data, hue);
    ctx.putImageData(pixels, 0, 0);
  }

  const sprite = { image, w, h };
  if (ready) {
    if (cache.size >= MAX_CACHED) cache.clear();
    cache.set(key, sprite);
  }
  return sprite;
}

/** The sprite resolution for drawing at `scale` on `ctx`: a power of two, so zooming reuses it. */
export function spriteRes(ctx: Ctx, scale: number): number {
  const m = ctx.getTransform?.();
  const zoom = m ? Math.hypot(m.a, m.b) : 1;
  const want = Math.max(scale * zoom, 1e-3);
  return Math.min(8, 2 ** Math.ceil(Math.log2(want)));
}
