import { z } from "zod";
import { writeExport } from "../exports.ts";
import { inProject, PROJECT } from "../project-scope.ts";
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
    "when the browser cannot encode H.264. `out` is the file path inside the project's " +
    "exports/ (default <scene>.<ext>); a path outside it fails; its extension follows the " +
    "real format. " +
    "`scale` sizes it relative to the scene (default 1). Starts a headless browser on first use.",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
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
    const effectiveCtx = await inProject(ctx, project);

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
    const target = await writeExport(
      effectiveCtx,
      out ?? `${name}.${ext}`,
      rendered.bytes,
      ext,
    );
    return {
      file: target,
      type: rendered.type,
      bytes: rendered.bytes.length,
      notices,
    };
  },
});
