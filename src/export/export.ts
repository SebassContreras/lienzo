import { assetFor, loadSceneAssets } from "../engine/assets.ts";
import { prepareAudioBufferForExport } from "../engine/audio/audio-export.ts";
import { drawScene } from "../engine/render.ts";
import type { Scene } from "../model/model.ts";
import type { FrameEncoder } from "./frame-encoder.ts";
import { createGifEncoder } from "./gif-encoder.ts";
import { createVideoEncoder } from "./video-encoder.ts";

export type ExportFormat = "png" | "gif" | "mp4";

export type ExportOptions = {
  format: ExportFormat;
  /** Output size relative to the scene size (GIFs are heavy at full size). */
  scale: number;
  fps: number;
  /** Time of the still frame for PNG. */
  time: number;
};

type Progress = (done: number, total: number) => void;

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

function frameCanvas(scene: Scene, scale: number) {
  const canvas = new OffscreenCanvas(
    even(scene.width * scale),
    even(scene.height * scale),
  );
  const ctx = canvas.getContext("2d", {
    willReadFrequently: true,
  }) as OffscreenCanvasRenderingContext2D;
  const render = (t: number) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(canvas.width / scene.width, canvas.height / scene.height);
    drawScene(ctx, scene, t);
  };
  return { canvas, ctx, render };
}

/** Lets the browser paint the progress bar between frames. */
const yieldToUi = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Renders a PNG of one frame, or encodes every frame of the scene as a GIF or a video. */
export async function exportScene(
  scene: Scene,
  options: ExportOptions,
  onProgress: Progress,
): Promise<Blob> {
  await document.fonts.ready;
  await loadSceneAssets(scene);
  const { canvas, ctx, render } = frameCanvas(scene, options.scale);
  if (options.format === "png") {
    render(options.time);
    return canvas.convertToBlob({ type: "image/png" });
  }
  let videoOptions: { audioBuffer?: AudioBuffer | null; audioStartOffset?: number } = {};
  if (options.format === "mp4" && scene.audio?.assetId) {
    const rawAudio = assetFor<AudioBuffer>(scene.audio.assetId);
    if (rawAudio) {
      const prepared = prepareAudioBufferForExport(rawAudio, scene.duration, scene.audio);
      if (prepared) {
        videoOptions = {
          audioBuffer: prepared.buffer,
          audioStartOffset: prepared.startOffset,
        };
      }
    }
  }

  const encoder =
    options.format === "gif"
      ? createGifEncoder(ctx, options.fps)
      : await createVideoEncoder(canvas, options.fps, videoOptions);
  return encodeFrames(encoder, render, scene.duration, options.fps, onProgress);
}

/** Every frame of `duration` seconds at `fps`, rendered and handed to `encoder`. */
async function encodeFrames(
  encoder: FrameEncoder,
  render: (t: number) => void,
  duration: number,
  fps: number,
  onProgress: Progress,
): Promise<Blob> {
  const total = Math.round(duration * fps);
  for (let i = 0; i < total; i++) {
    const t = i / fps;
    render(t);
    await encoder.add(t);
    onProgress(i + 1, total);
    await yieldToUi();
  }
  return encoder.finish();
}
