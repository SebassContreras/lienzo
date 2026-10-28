import { z } from "zod";
import { inProject, PROJECT } from "../../core/project-scope.ts";
import { defineTool } from "../../core/registry.ts";
import { findPreset } from "../../scenes/scenes.ts";

export const presetGet = defineTool({
  name: "preset_get",
  description:
    "Get one preset's recipe (kind, traits and own values) by its name or file name; with " +
    "`project`, that project's presets are searched too. A missing one fails at `name`, " +
    "naming the closest preset or listing some.",
  input: z.object({ name: z.string().min(1), project: PROJECT.optional() }),
  output: z.object({
    file: z.string(),
    source: z.enum(["built-in", "user"]),
    recipe: z.record(z.string(), z.unknown()),
  }),
  async run({ name, project }, ctx) {
    const scope = project ? await inProject(ctx, project) : ctx;
    const { file, source, recipe } = await findPreset(scope, name, {
      field: "name",
    });
    return { file, source, recipe };
  },
});
