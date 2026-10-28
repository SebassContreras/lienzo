import { z } from "zod";
import { ProjectSlugSchema } from "../../../model/project.ts";
import { defineTool } from "../../core/registry.ts";
import { availableFonts } from "../font-install.ts";

export const fontList = defineTool({
  name: "font_list",
  description:
    "List the fonts a scene can use: bundled, global (fonts/) and, with `project`, that " +
    "project's own (projects/<project>/fonts/), which hide global ones of the same family.",
  input: z.object({ project: ProjectSlugSchema.optional() }),
  output: z.array(
    z.object({
      family: z.string(),
      weight: z.number(),
      origin: z.enum(["bundled", "global", "project"]),
      url: z.string().optional(),
    }),
  ),
  async run({ project }, ctx) {
    return availableFonts(ctx.fonts, project);
  },
});
