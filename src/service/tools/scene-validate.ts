import { z } from "zod";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool } from "../registry.ts";
import { prepareScene } from "../scenes.ts";
import { Verdict, verdictOf } from "../verdict.ts";

export const sceneValidate = defineTool({
  name: "scene_validate",
  description:
    "Check a whole scene without saving it, as the editor would open it (animation " +
    "presets it names must exist). Returns the first failing path.",
  input: z.object({ scene: z.unknown(), project: PROJECT }),
  output: Verdict,
  run: async ({ scene, project }, ctx) => {
    const projectCtx = await inProject(ctx, project);
    return verdictOf(() => prepareScene(projectCtx, scene));
  },
});
