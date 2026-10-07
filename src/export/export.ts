import { applyPalette, GIFEncoder, quantize } from "gifenc";
import {
  BufferTarget,
  CanvasSource,
  canEncodeVideo,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  WebMOutputFormat,
} from "mediabunny";
import { loadSceneImages } from "../engine/images.ts";
import { drawScene } from "../engine/render.ts";
import type { Scene } from "../model/model.ts";

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

export async function exportScene(
  scene: Scene,
  options: ExportOptions,
  onProgress: Progress,
): Promise<Blob> {
  await document.fonts.ready;
  await loadSceneImages(scene);
  if (options.format === "png") return exportPng(scene, options);
  if (options.format === "gif") return exportGif(scene, options, onProgress);
  return exportVideo(scene, options, onProgress);
}

async function exportPng(scene: Scene, options: ExportOptions): Promise<Blob> {
  const { canvas, render } = frameCanvas(scene, options.scale);
  render(options.time);
  return canvas.convertToBlob({ type: "image/png" });
}

async function exportGif(
  scene: Scene,
  options: ExportOptions,
  onProgress: Progress,
): Promise<Blob> {
  const { canvas, ctx, render } = frameCanvas(scene, options.scale);
  const total = Math.round(scene.duration * options.fps);
  const gif = GIFEncoder();
  for (let i = 0; i < total; i++) {
    render(i / options.fps);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const palette = quantize(data, 256);
    gif.writeFrame(applyPalette(data, palette), canvas.width, canvas.height, {
      palette,
      delay: 1000 / options.fps,
      repeat: 0,
    });
    onProgress(i + 1, total);
    await yieldToUi();
  }
  gif.finish();
  return new Blob([gif.bytes() as BlobPart], { type: "image/gif" });
}

async function exportVideo(
  scene: Scene,
  options: ExportOptions,
  onProgress: Progress,
): Promise<Blob> {
  const { canvas, render } = frameCanvas(scene, options.scale);
  const size = { width: canvas.width, height: canvas.height };
  const useMp4 = await canEncodeVideo("avc", {
    ...size,
    quality: QUALITY_HIGH,
  });
  const codec = useMp4 ? "avc" : "vp9";
  const output = new Output({
    format: useMp4
      ? new Mp4OutputFormat({ fastStart: "in-memory" })
      : new WebMOutputFormat(),
    target: new BufferTarget(),
  });
  const source = new CanvasSource(canvas, { codec, quality: QUALITY_HIGH });
  output.addVideoTrack(source, { frameRate: options.fps });
  await output.start();

  const total = Math.round(scene.duration * options.fps);
  const frame = 1 / options.fps;
  for (let i = 0; i < total; i++) {
    render(i * frame);
    await source.add(i * frame, frame);
    onProgress(i + 1, total);
    if (i % 5 === 0) await yieldToUi();
  }
  await output.finalize();
  const buffer = (output.target as BufferTarget).buffer;
  if (!buffer) throw new Error("the video encoder produced no output");
  return new Blob([buffer], { type: useMp4 ? "video/mp4" : "video/webm" });
}

export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
