import { z } from "zod";
import { removeIn } from "../project-files.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool } from "../registry.ts";

export const sceneDelete = defineTool({
  name: "scene_delete",
  description:
    "Delete a scene from the project's scenes/, as the editor's Escenas tab does.",
  input: z.object({ project: PROJECT, name: z.string().min(1) }),
  output: z.object({ ok: z.literal(true) }),
  async run({ project, name }, ctx) {
    await removeIn(await inProject(ctx, project), "scenes", name);
    return { ok: true as const };
  },
});
