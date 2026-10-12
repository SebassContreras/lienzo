import { applyPalette, GIFEncoder, quantize } from "gifenc";
import type { FrameEncoder } from "./frame-encoder.ts";

/** A looping GIF of `ctx`'s canvas, one 256-colour palette per frame (gifenc). */
export function createGifEncoder(
  ctx: OffscreenCanvasRenderingContext2D,
  fps: number,
): FrameEncoder {
  const { width, height } = ctx.canvas;
  const gif = GIFEncoder();
  return {
    async add() {
      const { data } = ctx.getImageData(0, 0, width, height);
      const palette = quantize(data, 256);
      gif.writeFrame(applyPalette(data, palette), width, height, {
        palette,
        delay: 1000 / fps,
        repeat: 0,
      });
    },
    async finish() {
      gif.finish();
      return new Blob([gif.bytes() as BlobPart], { type: "image/gif" });
    },
  };
}
