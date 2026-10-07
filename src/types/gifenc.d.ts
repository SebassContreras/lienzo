// Types for gifenc 1.x (the package ships none). API: https://github.com/mattdesl/gifenc
declare module "gifenc" {
  export type Palette = number[][];
  export type GifFrameOptions = {
    palette?: Palette;
    /** Frame delay in milliseconds (stored in centiseconds). */
    delay?: number;
    /** 0 = loop forever, -1 = play once, n = repeat n times. */
    repeat?: number;
    transparent?: boolean;
    transparentIndex?: number;
    first?: boolean;
  };
  export type GifEncoderInstance = {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options?: GifFrameOptions,
    ): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
  };
  export function GIFEncoder(options?: {
    auto?: boolean;
    initialCapacity?: number;
  }): GifEncoderInstance;
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: { format?: "rgb565" | "rgb444" | "rgba4444" },
  ): Palette;
  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: Palette,
    format?: "rgb565" | "rgb444" | "rgba4444",
  ): Uint8Array;
}
