import { z } from "zod";
import { parsePresetRecipe } from "../../model/schema.ts";
import { defineTool, fail } from "../registry.ts";
import { Verdict, verdictOf } from "../verdict.ts";

export const presetValidate = defineTool({
  name: "preset_validate",
  description:
    "Check a preset recipe without saving it: its shape, and that its traits resolve to a " +
    "valid element or background. Returns the first failing path.",
  input: z.object({ recipe: z.unknown() }),
  output: Verdict,
  run: ({ recipe }) =>
    verdictOf(() => {
      const parsed = parsePresetRecipe(recipe);
      if (!parsed.ok) fail("invalid_preset", parsed.error, parsed.path);
    }),
});
