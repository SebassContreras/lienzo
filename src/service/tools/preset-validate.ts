import { z } from "zod";
import { parsePresetRecipe } from "../../model/schema.ts";
import { TRAITS } from "../../traits/index.ts";

/** What a recipe is, for preset_validate and preset_save (074/D15). */
export const RECIPE_RULES =
  "A recipe is `{ name, kind, category?, traits, set? }` and nothing else: `kind` is a " +
  "component kind (component_list) or `background`; `traits` applies style pieces in order, " +
  `each an id or \`{ use: id, …params }\` (ids: ${[...TRAITS.keys()].join(", ")}); \`set\` holds ` +
  "the element's own values on top (partial, as element_update patches; `tracks` times from " +
  "0, which a shot-bound element shifts to its shot's start). preset_get shows real ones. ";

import { defineTool, fail } from "../registry.ts";
import { Verdict, verdictOf } from "../verdict.ts";

export const presetValidate = defineTool({
  name: "preset_validate",
  description:
    "Check a preset recipe without saving it: its shape, that its traits resolve and that the " +
    "element or background it builds is valid (a wrong `set` value fails at `set.<field>`). " +
    RECIPE_RULES +
    "Returns every problem in `errors`.",
  input: z.object({ recipe: z.unknown() }),
  output: Verdict,
  run: ({ recipe }) =>
    verdictOf(() => {
      const parsed = parsePresetRecipe(recipe);
      if (!parsed.ok) fail("invalid_preset", parsed.error, parsed.path);
    }),
});
