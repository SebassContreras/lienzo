import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { defineTool } from "../registry.ts";
import { openScene } from "../scenes.ts";

/** GIFs above this frame rate only grow; the editor caps them the same way. */
const GIF_MAX_FPS = 25;

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export const sceneExport = defineTool({
  name: "scene_export",
  description:
    "Export a saved scene as a PNG (one frame at time `t`, default 0), a GIF or an MP4 " +
    "(the whole loop) and return the written file. MP4 falls back to WebM, with a notice, " +
    "when the browser cannot encode H.264. `out` is the file path (default " +
    "exports/<scene>.<ext>, relative to the repo); its extension follows the real format. " +
    "`scale` sizes it relative to the scene (default 1). Starts a headless browser on first use.",
  input: z.object({
    scene: z.string().min(1),
    format: z.enum(["png", "gif", "mp4"]),
    t: z.number().min(0).optional(),
    scale: z.number().min(0.1).max(2).optional(),
    fps: z.number().int().min(1).max(60).optional(),
    out: z.string().min(1).optional(),
  }),
  output: z.object({
    file: z.string(),
    type: z.string(),
    bytes: z.number(),
    notices: z.array(z.string()),
  }),
  async run({ scene: name, format, t = 0, scale = 1, fps, out }, ctx) {
    const scene = await openScene(ctx, name);
    const rendered = await ctx.renderer.render(scene, {
      format,
      scale,
      fps:
        fps ??
        (format === "gif" ? Math.min(scene.fps, GIF_MAX_FPS) : scene.fps),
      time: t,
    });
    const ext = EXTENSIONS[rendered.type] ?? format;
    const isStatic = scene.mode === "static";
    const notices: string[] = [];
    if (isStatic && (format === "mp4" || format === "gif")) {
      notices.push("La escena está configurada en modo 'static'; se recomienda exportar como 'png'.");
    }
    if (format === "mp4" && ext !== "mp4") {
      notices.push("H.264 no está disponible en este navegador; se exportó WebM");
    }
    const target = resolve(ctx.root, out ?? `exports/${name}.${ext}`).replace(
      /\.\w+$/,
      `.${ext}`,
    );
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, rendered.bytes);
    return {
      file: target,
      type: rendered.type,
      bytes: rendered.bytes.length,
      notices,
    };
  },
});
