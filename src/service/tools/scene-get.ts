import { z } from "zod";
import { defineTool } from "../registry.ts";
import { openScene } from "../scenes.ts";

export const sceneGet = defineTool({
  name: "scene_get",
  description:
    "Get a saved scene as JSON (size, timing, background, elements).",
  input: z.object({
    scene: z.string().min(1),
    project: z.string().optional(),
  }),
  output: z.record(z.string(), z.unknown()),
  async run({ scene, project }, ctx) {
    const { resolveProjectScope } = await import("../project-scope.ts");
    const { effectiveCtx } = await resolveProjectScope(ctx, project);
    return openScene(effectiveCtx, scene);
  },
});
