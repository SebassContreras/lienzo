import { z } from "zod";
import { defineTool } from "../registry.ts";
import { prepareScene } from "../scenes.ts";
import { Verdict, verdictOf } from "../verdict.ts";

export const sceneValidate = defineTool({
  name: "scene_validate",
  description:
    "Check a whole scene without saving it, as the editor would open it (animation " +
    "presets it names must exist). Returns the first failing path.",
  input: z.object({ scene: z.unknown() }),
  output: Verdict,
  run: ({ scene }, ctx) => verdictOf(() => prepareScene(ctx, scene)),
});
