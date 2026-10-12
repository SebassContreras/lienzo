import { z } from "zod";
import { defineTool } from "../registry.ts";
import { findPreset } from "../scenes.ts";

export const presetGet = defineTool({
  name: "preset_get",
  description:
    "Get one preset's recipe (kind, traits and own values) by its name or file name.",
  input: z.object({ name: z.string().min(1) }),
  output: z.object({
    file: z.string(),
    source: z.enum(["built-in", "user"]),
    recipe: z.record(z.string(), z.unknown()),
  }),
  async run({ name }, ctx) {
    const { file, source, recipe } = await findPreset(ctx, name);
    return { file, source, recipe };
  },
});
