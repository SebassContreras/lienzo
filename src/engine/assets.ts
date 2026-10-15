import { descriptorOf } from "../components/index.ts";
import type { Element, Scene } from "../model/model.ts";

/** Turns a URL into whatever drawing needs from it (a decoded image, a parsed model). */
export type AssetLoader = (src: string) => Promise<unknown>;

type Entry = { value?: unknown; ready: Promise<void> };

const cache = new Map<string, Entry>();

/** Loaders by file extension; anything else is an image. */
const loaders = new Map<string, AssetLoader>();

/** Makes files ending in `.ext` load through `load` (3D models, fonts). */
export function registerAssetLoader(ext: string, load: AssetLoader): void {
  loaders.set(ext.toLowerCase(), load);
}

const extOf = (src: string) =>
  src.split("?")[0]?.split(".").pop()?.toLowerCase() ?? "";

/**
 * Loads an asset once per path. Drawing is synchronous, so `drawScene` asks for the asset and
 * gets it only once it has loaded; exports await `loadSceneAssets` first.
 */
function entry(src: string): Entry {
  let e = cache.get(src);
  if (!e) {
    const created: Entry = { ready: Promise.resolve() };
    const load = loaders.get(extOf(src)) ?? loadImage;
    created.ready = load(src)
      .then((value) => {
        created.value = value;
      })
      .catch(() => {
        cache.delete(src);
      });
    e = created;
    cache.set(src, e);
  }
  return e;
}

/** The loaded asset at `src`, or undefined while it is still loading (or failed). */
export function assetFor<T>(src: string): T | undefined {
  return src ? (entry(src).value as T | undefined) : undefined;
}

type LoadedImage = { image: CanvasImageSource; width: number; height: number };

async function loadImage(src: string): Promise<LoadedImage> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const width = img.naturalWidth || 300;
  const height = img.naturalHeight || 150;
  try {
    return { image: await createImageBitmap(img), width, height };
  } catch {
    // some SVGs cannot become bitmaps; the decoded element draws just as well
    return { image: img, width, height };
  }
}

/** The decoded image for `src`, or undefined while it is still loading (or failed). */
export function imageFor(src: string): CanvasImageSource | undefined {
  return assetFor<LoadedImage>(src)?.image;
}

/** Natural size of an image, once decoded. */
export async function imageSize(
  src: string,
): Promise<{ width: number; height: number }> {
  await entry(src).ready;
  const loaded = assetFor<LoadedImage>(src);
  if (!loaded) throw new Error(`could not load ${src}`);
  return { width: loaded.width, height: loaded.height };
}

async function loadAudioBuffer(src: string): Promise<AudioBuffer | null> {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return null;
  const ctx = new AudioContextClass();
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  } catch {
    return null;
  } finally {
    ctx.close().catch(() => {});
  }
}

for (const ext of ["mp3", "wav", "aac", "ogg"]) {
  registerAssetLoader(ext, loadAudioBuffer);
}

function sceneSources(scene: Scene, out: Set<string>): Set<string> {
  if (scene.audio?.assetId) {
    out.add(scene.audio.assetId);
  }
  const collect = (elements: Element[]) => {
    for (const el of elements) {
      for (const src of descriptorOf(el.kind)?.assets?.(el as never) ?? []) {
        if (src) out.add(src);
      }
      if (el.kind === "group") collect(el.children);
    }
  };
  collect(scene.elements);
  return out;
}

/** Waits until every asset the scene uses has loaded, so every exported frame shows them. */
export async function loadSceneAssets(scene: Scene): Promise<void> {
  const sources = sceneSources(scene, new Set());
  await Promise.all([...sources].map((src) => entry(src).ready));
}
