import { imageFor, imageSize } from "./assets.ts";

/** RGBA bytes of a decoded picture and its natural size. */
type Pixels = { data: Uint8ClampedArray; width: number; height: number };

/**
 * The pixels of the asset at `src` (048/D4), read by drawing it on an offscreen canvas.
 * Assets are same-origin, so the canvas is never tainted. Rejects when it cannot decode.
 */
export async function imagePixels(src: string): Promise<Pixels> {
  const { width, height } = await imageSize(src);
  const image = imageFor(src);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!image || !ctx || width === 0 || height === 0)
    throw new Error(`could not read ${src}`);
  ctx.drawImage(image, 0, 0, width, height);
  return { data: ctx.getImageData(0, 0, width, height).data, width, height };
}
