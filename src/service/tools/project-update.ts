import { z } from "zod";
import {
  BrandFontSchema,
  ColorPaletteSchema,
  ProjectCanvasDefaultsSchema,
  ProjectManifestSchema,
  ProjectSlugSchema,
} from "../../model/project.ts";
import { defineTool, fail } from "../registry.ts";

export const projectUpdate = defineTool({
  name: "project_update",
  description:
    "Change a project's name, description, palette, brand fonts or canvas defaults, as the " +
    "editor's brand dialog does. Each field given replaces the stored one; the `project` id never changes.",
  input: z.object({
    project: ProjectSlugSchema,
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    palette: ColorPaletteSchema.optional(),
    fonts: BrandFontSchema.array().optional(),
    canvas: ProjectCanvasDefaultsSchema.optional(),
  }),
  output: ProjectManifestSchema,
  async run({ project, ...config }, ctx) {
    if (!(await ctx.projects.get(project)))
      fail("not_found", `No existe el proyecto «${project}»`, "project");
    return ctx.projects.update(project, config);
  },
});
