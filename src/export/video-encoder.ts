import {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  canEncodeAudio,
  canEncodeVideo,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  WebMOutputFormat,
} from "mediabunny";
import { registerAacEncoder } from "@mediabunny/aac-encoder";
import type { FrameEncoder } from "./frame-encoder.ts";

export type VideoEncoderOptions = {
  audioBuffer?: AudioBuffer | null;
  audioStartOffset?: number;
};

/** A video of `canvas` (mediabunny): H.264 MP4 when the browser can encode it, else WebM. */
export async function createVideoEncoder(
  canvas: OffscreenCanvas,
  fps: number,
  options: VideoEncoderOptions = {},
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

  let audioSource: AudioBufferSource | null = null;
  if (options.audioBuffer) {
    const audioCodec = useMp4 ? "aac" : "opus";
    // Firefox has no native AAC encoder; PCM in MP4 plays silent on phones/WhatsApp, so use the WASM AAC encoder
    if (
      useMp4 &&
      !(await canEncodeAudio("aac", {
        numberOfChannels: options.audioBuffer.numberOfChannels,
        sampleRate: options.audioBuffer.sampleRate,
      }))
    ) {
      registerAacEncoder();
    }

    audioSource = new AudioBufferSource(
      {
        codec: audioCodec,
        quality: QUALITY_HIGH,
      },
      {
        startTimestamp: options.audioStartOffset ?? 0,
      },
    );
    output.addAudioTrack(audioSource);
  }

  await output.start();

  if (audioSource && options.audioBuffer) {
    await audioSource.add(options.audioBuffer);
  }

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
