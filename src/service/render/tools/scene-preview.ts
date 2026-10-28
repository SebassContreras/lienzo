import { z } from "zod";
import { inProject, PROJECT } from "../../core/project-scope.ts";
import { defineTool } from "../../core/registry.ts";
import { extensionNotice, writeExport } from "../exports.ts";
import { ImageResult } from "../image.ts";
import {
  missingAssetNotices,
  resolveAndRenderScene,
} from "../render-target.ts";

export const scenePreview = defineTool({
  name: "scene_preview",
  effects: ["export"],
  description:
    "Render a saved scene at time `t` (seconds, default 0) as a PNG image to look at what " +
    "it shows. `scale` (default 0.5) sizes it relative to the scene. A `t` past the " +
    "scene's duration fails. Starts a headless " +
    "browser on first use. `out` also saves the PNG at that path inside the project's " +
    "exports/ (a path outside it fails) and returns it as `file`.",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    t: z.number().min(0).optional(),
    scale: z.number().min(0.1).max(2).optional(),
    out: z.string().min(1).optional(),
  }),
  output: ImageResult,
  async run({ scene: name, project, t = 0, scale = 0.5, out }, ctx) {
    const effectiveCtx = await inProject(ctx, project);

    const { scene, rendered } = await resolveAndRenderScene(
      effectiveCtx,
      name,
      {
        format: "png",
        scale,
        time: t,
      },
    );
    const file = out
      ? await writeExport(effectiveCtx, out, rendered.bytes, "png")
      : undefined;
    const notices = [
      ...(out && file ? [extensionNotice(out, file)] : []),
      ...(await missingAssetNotices(effectiveCtx, scene)),
    ].filter((n): n is string => n !== undefined);
    return {
      file,
      ...(notices.length > 0 ? { notices } : {}),
      image: {
        mimeType: "image/png" as const,
        data: rendered.bytes.toString("base64"),
      },
    };
  },
});
