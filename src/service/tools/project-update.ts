import { z } from "zod";
import { durationValue, fpsValue, side } from "../../model/limits.ts";
import {
  BrandFontSchema,
  ColorPaletteSchema,
  ProjectSlugSchema,
} from "../../model/project.ts";
import { missingFontNotice } from "../font-check.ts";
import { availableFonts } from "../font-install.ts";
import { asToolProject, ToolProjectSchema } from "../project-result.ts";
import { defineTool, fail } from "../registry.ts";

/** The canvas fields given; the others keep their stored values (069/D3). */
const CanvasPatchSchema = z.object({
  width: side().int().optional(),
  height: side().int().optional(),
  fps: fpsValue().int().optional(),
  duration: durationValue().optional(),
});

export const projectUpdate = defineTool({
  name: "project_update",
  description:
    "Change a project's name, description, palette, brand fonts or canvas defaults, as the " +
    "editor's brand dialog does. Each field given replaces the stored one, except `canvas`, " +
    "whose fields not given keep their values; the `project` id never changes. `notices` " +
    "names any brand font family that is not installed (run font_install).",
  input: z.object({
    project: ProjectSlugSchema,
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    palette: ColorPaletteSchema.optional(),
    fonts: BrandFontSchema.array().optional(),
    canvas: CanvasPatchSchema.optional(),
  }),
  output: ToolProjectSchema.extend({ notices: z.array(z.string()) }),
  async run({ project, canvas, ...config }, ctx) {
    const stored = await ctx.projects.get(project);
    if (!stored)
      fail("not_found", `No existe el proyecto «${project}»`, "project");
    const updated = await ctx.projects.update(project, {
      ...config,
      ...(canvas ? { canvas: { ...stored.manifest.canvas, ...canvas } } : {}),
    });
    const installed = new Set(
      (await availableFonts(ctx.fonts, project)).map((f) => f.family),
    );
    const notices = (config.fonts ?? [])
      .filter((f) => !installed.has(f.family))
      .map((f) => missingFontNotice(f.family));
    return { ...asToolProject(updated), notices };
  },
});
