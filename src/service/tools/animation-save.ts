import { join } from "node:path";
import { z } from "zod";
import { parseAnimPreset } from "../../model/anim-preset.ts";
import { readJson, writeJson } from "../../presets/json-fs.ts";
import { slugify } from "../../presets/slug.ts";
import { defineTool, fail } from "../registry.ts";

export const animationSave = defineTool({
  name: "animation_save",
  description:
    "Save an animation preset given in `recipe` ({ name, category?, anim?, tracks? }, checked as the editor's " +
    "import checks it) into presets/animations/, as the animation library does. The file is " +
    "named after `file`, else the preset's name; fails when it exists unless `overwrite` is true.",
  input: z.object({
    recipe: z.unknown(),
    file: z.string().min(1).optional(),
    overwrite: z.boolean().optional(),
  }),
  output: z.object({ animation: z.string() }),
  async run({ recipe, file, overwrite }, ctx) {
    const parsed = parseAnimPreset(recipe);
    if (!parsed.ok) fail("invalid_animation", parsed.error, parsed.path);
    const dir = join(ctx.root, "presets", "animations");
    const name = file ?? parsed.value.name;
    if (!overwrite && (await readJson(dir, name)) !== undefined)
      fail("exists", `Ya existe la animación «${slugify(name)}»`, "file");
    return { animation: await writeJson(dir, name, parsed.value) };
  },
});
