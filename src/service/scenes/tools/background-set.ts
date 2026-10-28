import { z } from "zod";
import { ignoredFields, ignoredNotice } from "../../../model/ignored.ts";
import { type Background, defaultScene } from "../../../model/model.ts";
import { BackgroundSchema } from "../../../model/schema.ts";
import { deepMerge, resolveBackground } from "../../../presets/resolve.ts";
import { inProject, PROJECT } from "../../core/project-scope.ts";
import { defineTool, fail } from "../../core/registry.ts";
import { editScene, findPreset, SceneResult } from "../scenes.ts";

export const backgroundSet = defineTool({
  name: "background_set",
  effects: ["scene"],
  description:
    "Set a scene's background from a background preset (see preset_list, kind " +
    "`background`) and/or `patch` (color, color2, gradient, angle, dots, dotColor, " +
    "dotGap, spotlight, spotlightColor) merged over it or over the current background; " +
    "`notices` names any other patch key, which is ignored. A missing preset fails naming the " +
    "closest background preset or listing them.",
  input: z
    .object({
      scene: z.string().min(1),
      project: PROJECT,
      preset: z.string().min(1).optional(),
      patch: z.record(z.string(), z.unknown()).optional(),
    })
    .refine((i) => i.preset !== undefined || i.patch !== undefined, {
      message: "Indica un preset o valores",
      path: ["preset"],
    }),
  output: SceneResult,
  async run({ scene, project, preset, patch }, ctx) {
    const projectCtx = await inProject(ctx, project);
    let base: Background | undefined;
    if (preset !== undefined) {
      const r = resolveBackground(
        (await findPreset(projectCtx, preset, { kind: "background" })).recipe,
      );
      if ("error" in r) fail("invalid_preset", r.error, "preset");
      base = r.background;
    }
    const ignored = patch
      ? ignoredFields(
          patch,
          BackgroundSchema.parse(defaultScene().background),
          "patch",
        ).map(ignoredNotice)
      : [];
    const result = await editScene(projectCtx, scene, (s) => {
      const background = structuredClone(base ?? s.background);
      if (patch)
        deepMerge(background as unknown as Record<string, unknown>, patch);
      return { ...s, background };
    });
    return { ...result, notices: [...ignored, ...result.notices] };
  },
});
