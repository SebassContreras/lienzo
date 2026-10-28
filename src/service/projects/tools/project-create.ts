import { z } from "zod";
import { durationValue, fpsValue, side } from "../../../model/limits.ts";
import {
  ColorPaletteSchema,
  ProjectConfigSchema,
  ProjectSlugSchema,
} from "../../../model/project.ts";
import { projectSlug } from "../../../presets/slug.ts";
import { defineTool, fail } from "../../registry.ts";
import { asToolProject, ToolProjectSchema } from "../project-result.ts";

export const projectCreate = defineTool({
  name: "project_create",
  description:
    "Create a new isolated project workspace in projects/<project>/ with its brand guide, " +
    "color palette, and directories for assets, presets, and scenes. `project` (lowercase " +
    "letters, digits and `-`) defaults to `name` made into one (accents folded: «Café Norte» " +
    "→ cafe-norte); the result names it; an existing id fails with `exists`. `canvas` fields not given take 1080x1080, 30 fps, 5 s.",
  input: z.object({
    project: ProjectSlugSchema.optional(),
    name: z.string().min(1, "El nombre del proyecto es obligatorio"),
    description: z.string().optional(),
    // colors are checked here, so a bad one fails on its path (069/D1)
    palette: ColorPaletteSchema.optional(),
    canvas: z
      .object({
        width: side().int().optional(),
        height: side().int().optional(),
        fps: fpsValue().int().optional(),
        duration: durationValue().optional(),
      })
      .optional(),
  }),
  output: ToolProjectSchema,
  async run({ project, name, description, palette, canvas }, ctx) {
    // one slug rule for every name (074/D6, 076/D4)
    const id = project ?? projectSlug(name).slice(0, 64).replace(/-+$/, "");
    if (!id)
      fail(
        "invalid_input",
        `No se puede hacer un identificador con «${name}»: indica \`project\` (minúsculas, números y guiones)`,
        "project",
      );
    if (await ctx.projects.get(id))
      fail(
        "exists",
        `Ya existe el proyecto «${id}»; pasa \`project\` con otro id si quieres un proyecto nuevo`,
        "project",
      );
    try {
      const config = ProjectConfigSchema.parse({
        name,
        description,
        palette: palette
          ? {
              primary: palette.primary,
              secondary: palette.secondary,
              accent: palette.accent,
              background: palette.background,
              surface: palette.surface,
              text: palette.text,
              custom: palette.custom ?? [],
            }
          : undefined,
        // fields not given take the schema's defaults
        canvas,
      });

      return asToolProject(await ctx.projects.create(id, config));
    } catch (error) {
      fail(
        "project_create_failed",
        String(error instanceof Error ? error.message : error),
        "project",
      );
    }
  },
});
