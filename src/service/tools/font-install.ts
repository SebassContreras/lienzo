import { z } from "zod";
import { ProjectSlugSchema } from "../../model/project.ts";
import { installGoogleFont } from "../font-install.ts";
import { defineTool, fail } from "../registry.ts";

export const fontInstall = defineTool({
  name: "font_install",
  description:
    "Download a Google Fonts family as woff2 into fonts/ (global) or, with `project`, into " +
    "projects/<slug>/fonts/. Scenes then use it by its family name.",
  input: z.object({
    family: z.string().min(1),
    weights: z.array(z.number().int().min(100).max(900)).min(1).default([400]),
    project: ProjectSlugSchema.optional(),
  }),
  output: z.array(
    z.object({ family: z.string(), weight: z.number(), file: z.string() }),
  ),
  async run({ family, weights, project }, ctx) {
    try {
      return await installGoogleFont(
        ctx.fonts,
        { family, weights, project },
        ctx.fetch,
      );
    } catch (error) {
      fail(
        "install_failed",
        error instanceof Error ? error.message : String(error),
        "family",
      );
    }
  },
});
