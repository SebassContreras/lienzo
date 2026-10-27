import { z } from "zod";
import { parsePresetRecipe } from "../../model/schema.ts";
import { readJson, writeJson } from "../../presets/json-fs.ts";
import { slugify } from "../../presets/slug.ts";
import { folderOf } from "../project-files.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";
import { RECIPE_RULES } from "./preset-validate.ts";

export const presetSave = defineTool({
  name: "preset_save",
  description:
    "Save a preset recipe (checked as preset_validate checks it) into the project's presets/, " +
    'as the editor\'s "Guardar como preset" does. The file is named after `file`, else the ' +
    "recipe's name (accents folded: «Caja Ámbar» → caja-ambar); fails when it exists unless " +
    "`overwrite` is true. " +
    RECIPE_RULES,
  input: z.object({
    project: PROJECT,
    recipe: z.unknown(),
    file: z.string().min(1).optional(),
    overwrite: z.boolean().optional(),
  }),
  output: z.object({ preset: z.string() }),
  async run({ project, recipe, file, overwrite }, ctx) {
    const parsed = parsePresetRecipe(recipe);
    if (!parsed.ok) fail("invalid_preset", parsed.error, parsed.path);
    const dir = folderOf(await inProject(ctx, project), "presets");
    const name = file ?? parsed.value.name;
    if (!overwrite && (await readJson(dir, name)) !== undefined)
      fail("exists", `Ya existe el preset «${slugify(name)}»`, "file");
    return { preset: await writeJson(dir, name, parsed.value) };
  },
});
