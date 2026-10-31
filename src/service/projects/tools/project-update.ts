import { z } from "zod";
import { durationValue, fpsValue, side } from "../../../model/limits.ts";
import {
  BrandFontSchema,
  ColorPaletteSchema,
  ProjectSlugSchema,
} from "../../../model/project.ts";
import { defineTool, fail } from "../../core/registry.ts";
import { projectFontNotices } from "../../fonts/font-install.ts";
import { GuideInputSchema, guideValue } from "../guide.ts";
import { asToolProject, ToolProjectSchema } from "../project-result.ts";

/** The canvas fields given; the others keep their stored values (069/D3). */
const CanvasPatchSchema = z.object({
  width: side().int().optional(),
  height: side().int().optional(),
  fps: fpsValue().int().optional(),
  duration: durationValue().optional(),
});

export const projectUpdate = defineTool({
  name: "project_update",
  effects: ["project"],
  description:
    "Change a project's name, description, palette, brand fonts or canvas defaults, as the " +
    "editor's brand dialog does. Each field given replaces the stored one, except `canvas`, " +
    "whose fields not given keep their values; the `project` id never changes. `notices` " +
    "names what is wrong with the brand fonts: a declared family or weight not installed (run " +
    "font_install) and a family installed in the project but not declared (add it to `fonts`). " +
    "`guide` replaces the written brand guide (Markdown up to 20 000 characters, brand.md); " +
    '`""` or `null` deletes it; left out it is kept. The result returns `guide` as stored.',
  input: z.object({
    project: ProjectSlugSchema,
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    palette: ColorPaletteSchema.optional(),
    fonts: BrandFontSchema.array().optional(),
    canvas: CanvasPatchSchema.optional(),
    guide: GuideInputSchema,
  }),
  output: ToolProjectSchema.extend({
    guide: z.string().nullable(),
    notices: z.array(z.string()),
  }),
  async run({ project, canvas, guide, ...config }, ctx) {
    const text = guideValue(guide);
    const stored = await ctx.projects.get(project);
    if (!stored)
      fail("not_found", `No existe el proyecto «${project}»`, "project");
    // every input is valid here: the guide first, then the manifest (086/D1)
    if (text !== undefined) await ctx.projects.writeGuide(project, text);
    const updated = await ctx.projects.update(project, {
      ...config,
      ...(canvas ? { canvas: { ...stored.manifest.canvas, ...canvas } } : {}),
    });
    const notices = await projectFontNotices(ctx.fonts, project, updated.fonts);
    return {
      ...asToolProject(updated),
      guide: text === undefined ? stored.guide : text,
      notices,
    };
  },
});
