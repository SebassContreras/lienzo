import { z } from "zod";
import { renameIn, storedAsNotice } from "../../project-files.ts";
import { inProject, PROJECT } from "../../project-scope.ts";
import { defineTool } from "../../registry.ts";

export const sceneRename = defineTool({
  name: "scene_rename",
  description:
    "Rename a scene in the project's scenes/ (its file and its stored name), as the editor's " +
    "Escenas tab does. Fails when `to` is taken; the old name stops working, and `notices` says when `to` was stored under another name.",
  input: z.object({
    project: PROJECT,
    from: z.string().min(1),
    to: z.string().min(1),
  }),
  output: z.object({ scene: z.string(), notices: z.array(z.string()) }),
  async run({ project, from, to }, ctx) {
    const scene = await renameIn(
      await inProject(ctx, project),
      "scenes",
      from,
      to,
    );
    return { scene, notices: storedAsNotice(to, scene) };
  },
});
