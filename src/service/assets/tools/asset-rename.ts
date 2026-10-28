import { z } from "zod";
import { inProject, PROJECT } from "../../core/project-scope.ts";
import { defineTool } from "../../core/registry.ts";
import { renameAsset } from "../project-assets.ts";

export const assetRename = defineTool({
  name: "asset_rename",
  description:
    "Rename or move a project asset: `from` and `to` are paths inside the project's assets/ " +
    "(subfolders allowed, e.g. `logos/acme.png`). Every scene referencing it is rewritten " +
    "to the new path. Returns the new path and the scenes changed.",
  input: z.object({
    project: PROJECT,
    from: z.string().min(1),
    to: z.string().min(1),
  }),
  output: z.object({ path: z.string(), scenes: z.array(z.string()) }),
  async run({ project, from, to }, ctx) {
    await inProject(ctx, project);
    return renameAsset(ctx.projects, project, from, to);
  },
});
