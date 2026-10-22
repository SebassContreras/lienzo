import { createElement } from "../components/index.ts";
import type { ImageEl } from "../model/model.ts";

/**
 * The image element a dropped project asset becomes (044/D4): centred on `at`, the default
 * width, and the height of the image's own aspect ratio when its natural size is known.
 */
export function imageElementFor(
  src: string,
  name: string,
  at: { x: number; y: number },
  natural?: { width: number; height: number },
): ImageEl {
  const el = createElement("image") as ImageEl;
  el.src = src;
  el.name = name;
  if (natural && natural.width > 0 && natural.height > 0) {
    el.h = Math.round((el.w * natural.height) / natural.width);
  }
  el.x = Math.round(at.x - el.w / 2);
  el.y = Math.round(at.y - el.h / 2);
  return el;
}
