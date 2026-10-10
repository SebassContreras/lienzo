import { z } from "zod";
import type { PresetRecipe } from "../../model/preset.ts";
import { asRecipe } from "../../presets/store.ts";
import { defineTool } from "../registry.ts";

export const presetList = defineTool({
  name: "preset_list",
  description:
    "List every element and background preset, built-in first, then the user's. " +
    "Use a preset's name with element_add or background_set.",
  input: z.object({}),
  output: z.array(
    z.object({
      name: z.string(),
      file: z.string(),
      source: z.enum(["built-in", "user"]),
      kind: z.string(),
      category: z.string().optional(),
    }),
  ),
  async run(_input, ctx) {
    return (await ctx.store.presets()).map((p) => {
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
