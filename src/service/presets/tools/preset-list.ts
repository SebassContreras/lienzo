import { z } from "zod";
import type { PresetRecipe } from "../../../model/preset.ts";
import { asRecipe } from "../../../presets/store.ts";
import { inProject, PROJECT } from "../../project-scope.ts";
import { defineTool } from "../../registry.ts";

export const presetList = defineTool({
  name: "preset_list",
  description:
    "List every element and background preset, built-in first, then the user's; with " +
    "`project`, the user's are that project's presets/. " +
    "Use a preset's name with element_add or background_set.",
  input: z.object({ project: PROJECT.optional() }),
  output: z.array(
    z.object({
      name: z.string(),
      file: z.string(),
      source: z.enum(["built-in", "user"]),
      kind: z.string(),
      category: z.string().optional(),
    }),
  ),
  async run({ project }, ctx) {
    const store = project ? (await inProject(ctx, project)).store : ctx.store;
    return (await store.presets()).map((p) => {
      const r = asRecipe(p.data as PresetRecipe);
      return {
        name: r.name,
        file: p.file,
        source: p.source,
        kind: r.kind,
        category: r.category,
      };
    });
  },
});
