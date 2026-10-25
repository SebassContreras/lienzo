import { z } from "zod";
import { parseAnimPreset } from "../../model/anim-preset.ts";
import { defineTool } from "../registry.ts";

export const animationList = defineTool({
  name: "animation_list",
  description:
    "List the animation presets (the editor's animation library) with their file name, name " +
    "and category; files that fail the schema are left out. Use a name as an element's " +
    "`animPreset`.",
  input: z.object({}),
  output: z.object({
    animations: z.array(
      z.object({
        file: z.string(),
        name: z.string(),
        category: z.string().optional(),
      }),
    ),
  }),
  run: async (_input, ctx) => ({
    animations: (await ctx.store.animPresets()).flatMap((item) => {
      const parsed = parseAnimPreset(item.data);
      if (!parsed.ok) return [];
      const { name, category } = parsed.value;
      return [{ file: item.name, name, ...(category ? { category } : {}) }];
    }),
  }),
});
