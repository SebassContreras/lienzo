import { z } from "zod";
import { ElementSchema } from "../../../model/element-schema.ts";
import { ignoredFields, ignoredNotice } from "../../../model/ignored.ts";
import type { PresetRecipe } from "../../../model/preset.ts";
import { BackgroundSchema, parsePresetRecipe } from "../../../model/schema.ts";
import { readJson, writeJson } from "../../../presets/json-fs.ts";
import { resolvePreset } from "../../../presets/resolve.ts";
import { slugify } from "../../../presets/slug.ts";
import { inProject, PROJECT } from "../../project-scope.ts";
import { folderOf, storedAsNotice } from "../../projects/project-files.ts";
import { defineTool, fail, failAll } from "../../registry.ts";
import { refuseBuiltInName } from "../../scenes/scenes.ts";
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
  output: z.object({ preset: z.string(), notices: z.array(z.string()) }),
  async run({ project, recipe, file, overwrite }, ctx) {
    const parsed = parsePresetRecipe(recipe);
    if (!parsed.ok) failAll("invalid_preset", parsed.issues);
    const pctx = await inProject(ctx, project);
    await refuseBuiltInName(pctx, parsed.value.name, "recipe.name");
    const dir = folderOf(pctx, "presets");
    const name = file ?? parsed.value.name;
    if (!overwrite && (await readJson(dir, name)) !== undefined)
      fail("exists", `Ya existe el preset «${slugify(name)}»`, "file");
    const preset = await writeJson(dir, name, parsed.value);
    // a `set` key the kind has no field for is dropped when the preset is used (081/D7)
    const built = resolvePreset(parsed.value as PresetRecipe);
    const raw =
      "element" in built
        ? built.element
        : "background" in built
          ? built.background
          : {};
    const kept =
      "element" in built
        ? ElementSchema.safeParse(raw).data
        : BackgroundSchema.safeParse(raw).data;
    const set = Object.keys(parsed.value.set ?? {});
    const ignored = ignoredFields(raw, kept)
      .filter((f) => set.includes(f.path.split(".")[0] ?? ""))
      .map((f) => ignoredNotice({ ...f, path: `set.${f.path}` }));
    return { preset, notices: [...ignored, ...storedAsNotice(name, preset)] };
  },
});
