import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { defineTool } from "../registry.ts";
import { resolveAndRenderScene } from "../render-target.ts";

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
    project: z.string().optional(),
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
  async run({ scene: name, project, format, t = 0, scale = 1, fps, out }, ctx) {
    const { resolveProjectScope } = await import("../project-scope.ts");
    const { slug: projectSlug, effectiveCtx } = await resolveProjectScope(
      ctx,
      project,
    );

    const { scene, rendered } = await resolveAndRenderScene(
      effectiveCtx,
      name,
      {
        format,
        scale,
        fps,
        time: t,
      },
    );
    const ext = EXTENSIONS[rendered.type] ?? format;
    const isStatic = scene.mode === "static";
    const notices: string[] = [];
    if (isStatic && (format === "mp4" || format === "gif")) {
      notices.push(
        "La escena está configurada en modo 'static'; se recomienda exportar como 'png'.",
      );
    }
    if (format === "mp4" && ext !== "mp4") {
      notices.push(
        "H.264 no está disponible en este navegador; se exportó WebM",
      );
    }
    const defaultOut = `projects/${projectSlug}/exports/${name}.${ext}`;
    const target = resolve(ctx.root, out ?? defaultOut).replace(
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
