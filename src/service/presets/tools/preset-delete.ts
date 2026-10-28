import { z } from "zod";
import { removeIn } from "../../project-files.ts";
import { inProject, PROJECT } from "../../project-scope.ts";
import { defineTool } from "../../registry.ts";
import { refuseBuiltIn } from "../../scenes/scenes.ts";

export const presetDelete = defineTool({
  name: "preset_delete",
  description:
    "Delete a preset from the project's presets/ by name or file name. A built-in preset is " +
    "not in the project and cannot be deleted: it fails with `built_in`.",
  input: z.object({ project: PROJECT, name: z.string().min(1) }),
  output: z.object({ ok: z.literal(true) }),
  async run({ project, name }, ctx) {
    const pctx = await inProject(ctx, project);
    await refuseBuiltIn(pctx, name, "name");
    await removeIn(pctx, "presets", name, "name");
    return { ok: true as const };
  },
});
