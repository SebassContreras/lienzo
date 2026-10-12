import {
  BufferTarget,
  CanvasSource,
  canEncodeVideo,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  WebMOutputFormat,
} from "mediabunny";
import type { FrameEncoder } from "./frame-encoder.ts";

/** A video of `canvas` (mediabunny): H.264 MP4 when the browser can encode it, else WebM. */
export async function createVideoEncoder(
  canvas: OffscreenCanvas,
  fps: number,
): Promise<FrameEncoder> {
  const size = { width: canvas.width, height: canvas.height };
  const useMp4 = await canEncodeVideo("avc", {
    ...size,
    quality: QUALITY_HIGH,
  });
  const output = new Output({
    format: useMp4
      ? new Mp4OutputFormat({ fastStart: "in-memory" })
      : new WebMOutputFormat(),
    target: new BufferTarget(),
  });
  const source = new CanvasSource(canvas, {
    codec: useMp4 ? "avc" : "vp9",
    quality: QUALITY_HIGH,
  });
  output.addVideoTrack(source, { frameRate: fps });
  await output.start();
  return {
    add: (t) => source.add(t, 1 / fps),
    async finish() {
      await output.finalize();
      const buffer = (output.target as BufferTarget).buffer;
      if (!buffer) throw new Error("the video encoder produced no output");
      return new Blob([buffer], { type: useMp4 ? "video/mp4" : "video/webm" });
    },
  };
}
