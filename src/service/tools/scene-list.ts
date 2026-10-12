import { z } from "zod";
import { parseScene } from "../../model/schema.ts";
import { defineTool } from "../registry.ts";

export const sceneList = defineTool({
  name: "scene_list",
  description:
    "List the saved scenes in scenes/ with their size, duration and element count; " +
    "`valid` is false for a file the editor would refuse.",
  input: z.object({}),
  output: z.array(
    z.object({
      name: z.string(),
      valid: z.boolean(),
      width: z.number().optional(),
      height: z.number().optional(),
      duration: z.number().optional(),
      elements: z.number().optional(),
    }),
  ),
  async run(_input, ctx) {
    return (await ctx.store.scenes()).map(({ name, data }) => {
      const parsed = parseScene(data);
      if (!parsed.ok) return { name, valid: false };
      const { width, height, duration, elements } = parsed.value;
      return {
        name,
        valid: true,
        width,
        height,
        duration,
        elements: elements.length,
      };
    });
  },
});
