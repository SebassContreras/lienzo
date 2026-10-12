/**
 * What an animated export writes frames into (A18 adapters): the GIF and video encoders each
 * wrap one library behind this, so `export.ts` runs one frame loop for both and an encoder
 * can be swapped without touching it.
 */
export type FrameEncoder = {
  /** Adds what the canvas shows now, as the frame at `t` seconds. */
  add(t: number): Promise<void>;
  /** Ends the file. */
  finish(): Promise<Blob>;
};
