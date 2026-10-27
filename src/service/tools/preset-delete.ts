import { z } from "zod";
import { removeIn } from "../project-files.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool } from "../registry.ts";

export const presetDelete = defineTool({
  name: "preset_delete",
  description:
    "Delete a preset from the project's presets/ by file name. Built-in presets are not in " +
    "the project and cannot be deleted.",
  input: z.object({ project: PROJECT, name: z.string().min(1) }),
  output: z.object({ ok: z.literal(true) }),
  async run({ project, name }, ctx) {
    await removeIn(await inProject(ctx, project), "presets", name, "name");
    return { ok: true as const };
  },
});
