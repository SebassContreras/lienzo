import { z } from "zod";
import { ImageResult } from "../image.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool } from "../registry.ts";
import { resolveAndRenderScene } from "../render-target.ts";

export const scenePreview = defineTool({
  name: "scene_preview",
  description:
    "Render a saved scene at time `t` (seconds, default 0) as a PNG image to look at what " +
    "it shows. `scale` (default 0.5) sizes it relative to the scene. Starts a headless " +
    "browser on first use.",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    t: z.number().min(0).optional(),
    scale: z.number().min(0.1).max(2).optional(),
  }),
  output: ImageResult,
  async run({ scene: name, project, t = 0, scale = 0.5 }, ctx) {
    const effectiveCtx = await inProject(ctx, project);

    const { rendered } = await resolveAndRenderScene(effectiveCtx, name, {
      format: "png",
      scale,
      time: t,
    });
    return {
      image: {
        mimeType: "image/png" as const,
        data: rendered.bytes.toString("base64"),
      },
    };
  },
});
