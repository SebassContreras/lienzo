import type { Element, Scene } from "../model/model.ts";

type Entry = {
  image?: CanvasImageSource;
  width: number;
  height: number;
  ready: Promise<void>;
};

const cache = new Map<string, Entry>();

/**
 * Loads an image once per path. Drawing is synchronous, so `drawScene` asks for the image and
 * gets it only once it has decoded; exports await `loadSceneImages` first.
 */
function entry(src: string): Entry {
  let e = cache.get(src);
  if (!e) {
    const created: Entry = { width: 0, height: 0, ready: Promise.resolve() };
    created.ready = (async () => {
      const img = new Image();
      img.src = src;
      await img.decode();
      created.width = img.naturalWidth || 300;
      created.height = img.naturalHeight || 150;
      try {
        created.image = await createImageBitmap(img);
      } catch {
        // some SVGs cannot become bitmaps; the decoded element draws just as well
        created.image = img;
      }
    })().catch(() => {
      cache.delete(src);
    });
    e = created;
    cache.set(src, e);
  }
  return e;
}

/** The decoded image for `src`, or undefined while it is still loading (or failed). */
export function imageFor(src: string): CanvasImageSource | undefined {
  return src ? entry(src).image : undefined;
}

/** Natural size of an image, once decoded. */
export async function imageSize(
  src: string,
): Promise<{ width: number; height: number }> {
  const e = entry(src);
  await e.ready;
  if (!e.image) throw new Error(`could not load ${src}`);
  return { width: e.width, height: e.height };
}

function imageSources(elements: Element[], out: Set<string>): Set<string> {
  for (const el of elements) {
    if (el.kind === "image" && el.src) out.add(el.src);
    if (el.kind === "group") imageSources(el.children, out);
  }
  return out;
}

/** Waits until every image the scene uses has decoded, so every exported frame shows them. */
export async function loadSceneImages(scene: Scene): Promise<void> {
  const sources = imageSources(scene.elements, new Set());
  await Promise.all([...sources].map((src) => entry(src).ready));
}
