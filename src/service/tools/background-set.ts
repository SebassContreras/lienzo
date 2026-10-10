import { z } from "zod";
import type { Background } from "../../model/model.ts";
import { deepMerge, resolveBackground } from "../../presets/resolve.ts";
import { defineTool, fail } from "../registry.ts";
import { editScene, findPreset, SceneResult } from "../scenes.ts";

export const backgroundSet = defineTool({
  name: "background_set",
  description:
    "Set a scene's background from a background preset (see preset_list, kind " +
    "`background`) and/or `values` (color, color2, gradient, angle, dots, dotColor, " +
    "dotGap, spotlight, spotlightColor) merged over it or over the current background.",
  input: z
    .object({
      scene: z.string().min(1),
      preset: z.string().min(1).optional(),
      values: z.record(z.string(), z.unknown()).optional(),
    })
    .refine((i) => i.preset !== undefined || i.values !== undefined, {
      message: "Indica un preset o valores",
      path: ["preset"],
    }),
  output: SceneResult,
  async run({ scene, preset, values }, ctx) {
    let base: Background | undefined;
    if (preset !== undefined) {
      const r = resolveBackground((await findPreset(ctx, preset)).recipe);
      if ("error" in r) fail("invalid_preset", r.error, "preset");
      base = r.background;
    }
    return editScene(ctx, scene, (s) => {
      const background = structuredClone(base ?? s.background);
      if (values)
        deepMerge(background as unknown as Record<string, unknown>, values);
      return { ...s, background };
    });
  },
});
