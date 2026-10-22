import { z } from "zod";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool } from "../registry.ts";
import { openScene } from "../scenes.ts";

export const sceneGet = defineTool({
  name: "scene_get",
  description:
    "Get a saved scene as JSON (size, timing, background, elements).",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
  }),
  output: z.record(z.string(), z.unknown()),
  async run({ scene, project }, ctx) {
    const effectiveCtx = await inProject(ctx, project);
    return openScene(effectiveCtx, scene);
  },
});
