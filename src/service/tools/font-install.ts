import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { z } from "zod";
import { ProjectSlugSchema } from "../../model/project.ts";
import { installGoogleFont, saveFont } from "../font-install.ts";
import { defineTool, fail } from "../registry.ts";

export const fontInstall = defineTool({
  name: "font_install",
  description:
    "Download a Google Fonts family as woff2 into fonts/ (global) or, with `project`, into " +
    "projects/<slug>/fonts/. With `file` (a local ttf, otf, woff or woff2), installs that file " +
    "instead, as the editor's font upload does, under `family` and the first of `weights`. " +
    "Scenes then use it by its family name.",
  input: z.object({
    family: z.string().min(1),
    weights: z.array(z.number().int().min(100).max(900)).min(1).default([400]),
    project: ProjectSlugSchema.optional(),
    file: z.string().min(1).optional(),
  }),
  output: z.array(
    z.object({ family: z.string(), weight: z.number(), file: z.string() }),
  ),
  async run({ family, weights, project, file }, ctx) {
    try {
      if (file)
        return [
          await saveFont(
            ctx.fonts,
            {
              family,
              weight: weights[0] ?? 400,
              ext: extname(file).slice(1),
              project,
            },
            await readFile(file),
          ),
        ];
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
