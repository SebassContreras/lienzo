import { z } from "zod";
import { parseAnimPreset } from "../../model/anim-preset.ts";
import { readJson, writeJson } from "../../presets/json-fs.ts";
import { slugify } from "../../presets/slug.ts";
import { animationsDir } from "../project-files.ts";
import { PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";

export const animationSave = defineTool({
  name: "animation_save",
  description:
    "Save an animation preset given in `recipe` ({ name, category?, anim?, tracks? }, checked as the editor's " +
    "import checks it; an `anim.in`/`loop`/`out` given in part takes the defaults for the rest; " +
    "`tracks` take the short keyframe form `[t, value, easing?]`; any other key fails) " +
    "into the project's presets/animations/ with `project`, else the global presets/animations/. The file is " +
    "named after `file`, else the preset's name; fails when it exists unless `overwrite` is true. " +
    "animation_delete removes it.",
  input: z.object({
    recipe: z.unknown(),
    project: PROJECT.optional(),
    file: z.string().min(1).optional(),
    overwrite: z.boolean().optional(),
  }),
  output: z.object({ animation: z.string() }),
  async run({ recipe, project, file, overwrite }, ctx) {
    const parsed = parseAnimPreset(recipe);
    if (!parsed.ok) fail("invalid_animation", parsed.error, parsed.path);
    const dir = await animationsDir(ctx, project);
    const name = file ?? parsed.value.name;
    if (!overwrite && (await readJson(dir, name)) !== undefined)
      fail("exists", `Ya existe la animación «${slugify(name)}»`, "file");
    return { animation: await writeJson(dir, name, parsed.value) };
  },
});
