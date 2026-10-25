import { z } from "zod";
import { renameIn } from "../project-files.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool } from "../registry.ts";

export const presetRename = defineTool({
  name: "preset_rename",
  description:
    "Rename a preset in the project's presets/ (its file and its stored name). Built-in " +
    "presets are not in the project and cannot be renamed. Fails when `to` is taken.",
  input: z.object({
    project: PROJECT,
    from: z.string().min(1),
    to: z.string().min(1),
  }),
  output: z.object({ preset: z.string() }),
  run: async ({ project, from, to }, ctx) => ({
    preset: await renameIn(await inProject(ctx, project), "presets", from, to),
  }),
});
