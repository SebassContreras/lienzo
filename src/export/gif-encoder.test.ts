import { describe, expect, it } from "vitest";
import { createGifEncoder } from "./gif-encoder.ts";

/** A 4×2 canvas context whose pixels are all `rgba`. */
function solidCtx(rgba: [number, number, number, number]) {
  const width = 4;
  const height = 2;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) data.set(rgba, i);
  return {
    canvas: { width, height },
    getImageData: () => ({ data }),
  } as unknown as OffscreenCanvasRenderingContext2D;
}

describe("createGifEncoder", () => {
  it("writes a looping GIF of the canvas size with one image per frame", async () => {
    const gif = createGifEncoder(solidCtx([255, 0, 0, 255]), 10);
    await gif.add(0);
    await gif.add(0.1);
    const blob = await gif.finish();
    const bytes = new Uint8Array(await blob.arrayBuffer());

    expect(blob.type).toBe("image/gif");
    expect(new TextDecoder().decode(bytes.slice(0, 6))).toBe("GIF89a");
    // logical screen width and height, little endian
    expect(bytes[6] | (bytes[7] << 8)).toBe(4);
    expect(bytes[8] | (bytes[9] << 8)).toBe(2);
    expect(new TextDecoder().decode(bytes)).toContain("NETSCAPE2.0");
    // one image descriptor (0x2c) after each graphic control extension (0x21 0xf9)
    const frames = bytes.filter(
      (b, i) => b === 0x21 && bytes[i + 1] === 0xf9,
    ).length;
    expect(frames).toBe(2);
    expect(bytes.at(-1)).toBe(0x3b);
  });

  it("the delay of each frame is 1/fps, in hundredths of a second", async () => {
    const gif = createGifEncoder(solidCtx([0, 0, 255, 255]), 25);
    await gif.add(0);
    const bytes = new Uint8Array(await (await gif.finish()).arrayBuffer());
    const gce = bytes.findIndex((b, i) => b === 0x21 && bytes[i + 1] === 0xf9);
    expect(bytes[gce + 4] | (bytes[gce + 5] << 8)).toBe(4);
  });
});
