import { z } from "zod";
import { inProject, PROJECT } from "../../core/project-scope.ts";
import { defineTool } from "../../core/registry.ts";
import { removeIn } from "../../projects/project-files.ts";

export const sceneDelete = defineTool({
  name: "scene_delete",
  description:
    "Delete a scene from the project's scenes/ (by name or file name), as the editor's " +
    "Escenas tab does; a missing one fails at `scene`.",
  input: z.object({ project: PROJECT, scene: z.string().min(1) }),
  output: z.object({ ok: z.literal(true) }),
  async run({ project, scene }, ctx) {
    await removeIn(await inProject(ctx, project), "scenes", scene, "scene");
    return { ok: true as const };
  },
});
