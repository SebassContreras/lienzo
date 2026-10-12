import { z } from "zod";
import { defineTool } from "../registry.ts";
import { openScene } from "../scenes.ts";

export const sceneGet = defineTool({
  name: "scene_get",
  description:
    "Get a saved scene as JSON (size, timing, background, elements).",
  input: z.object({ scene: z.string().min(1) }),
  output: z.record(z.string(), z.unknown()),
  run: ({ scene }, ctx) => openScene(ctx, scene),
});
