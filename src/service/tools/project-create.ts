import { z } from "zod";
import { ProjectConfigSchema, ProjectSlugSchema } from "../../model/project.ts";
import { asToolProject, ToolProjectSchema } from "../project-result.ts";
import { defineTool, fail } from "../registry.ts";

export const projectCreate = defineTool({
  name: "project_create",
  description:
    "Create a new isolated project workspace in projects/<project>/ with its brand guide, " +
    "color palette, and directories for assets, presets, and scenes.",
  input: z.object({
    project: ProjectSlugSchema,
    name: z.string().min(1, "El nombre del proyecto es obligatorio"),
    description: z.string().optional(),
    palette: z
      .object({
        primary: z.string().min(1),
        secondary: z.string().optional(),
        accent: z.string().optional(),
        background: z.string().optional(),
        surface: z.string().optional(),
        text: z.string().optional(),
        custom: z.array(z.string()).optional(),
      })
      .optional(),
    canvas: z
      .object({
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        fps: z.number().int().positive().optional(),
        duration: z.number().positive().optional(),
      })
      .optional(),
  }),
  output: ToolProjectSchema,
  async run({ project, name, description, palette, canvas }, ctx) {
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
        canvas: canvas
          ? {
              width: canvas.width ?? 1080,
              height: canvas.height ?? 1080,
              fps: canvas.fps ?? 30,
              duration: canvas.duration ?? 5,
            }
          : undefined,
      });

      return asToolProject(await ctx.projects.create(project, config));
    } catch (error) {
      fail(
        "project_create_failed",
        String(error instanceof Error ? error.message : error),
        "project",
      );
    }
  },
});
