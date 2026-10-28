import { z } from "zod";
import { inProject, PROJECT } from "../../core/project-scope.ts";
import { defineTool } from "../../core/registry.ts";
import { deleteAsset } from "../project-assets.ts";

export const assetDelete = defineTool({
  name: "asset_delete",
  effects: ["asset"],
  description:
    "Delete a project asset (`path` inside assets/). Refuses while any scene references it " +
    "and names those scenes; `force: true` deletes anyway and leaves those references broken.",
  input: z.object({
    project: PROJECT,
    path: z.string().min(1),
    force: z.boolean().optional(),
  }),
  output: z.object({ path: z.string(), usedBy: z.array(z.string()) }),
  async run({ project, path, force }, ctx) {
    await inProject(ctx, project);
    return deleteAsset(ctx.projects, project, path, force);
  },
});
