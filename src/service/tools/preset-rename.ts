import { z } from "zod";
import { renameIn, storedAsNotice } from "../project-files.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool } from "../registry.ts";
import { refuseBuiltIn } from "../scenes.ts";

export const presetRename = defineTool({
  name: "preset_rename",
  description:
    "Rename a preset in the project's presets/ (its file and its stored name). Built-in " +
    "presets are not in the project and cannot be renamed. Fails when `to` is taken; the old name stops working, and `notices` says when `to` was stored under another name.",
  input: z.object({
    project: PROJECT,
    from: z.string().min(1),
    to: z.string().min(1),
  }),
  output: z.object({ preset: z.string(), notices: z.array(z.string()) }),
  async run({ project, from, to }, ctx) {
    const pctx = await inProject(ctx, project);
    await refuseBuiltIn(pctx, from, "from");
    const preset = await renameIn(pctx, "presets", from, to);
    return { preset, notices: storedAsNotice(to, preset) };
  },
});
