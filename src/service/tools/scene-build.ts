import { z } from "zod";
import { CompactSceneSchema } from "../../model/compact.ts";
import { SceneSchema } from "../../model/schema.ts";
import { slugify } from "../../presets/slug.ts";
import { expandScene } from "../compact/expand.ts";
import { defineTool, fail } from "../registry.ts";
import { checkScene, findPreset, SceneResult, saveScene } from "../scenes.ts";

export const sceneBuild = defineTool({
  name: "scene_build",
  description:
    "Build a full scene from a compact description (spec 011). Expands size, background, " +
    "presets, shortcuts (at, fit, from, to, short tracks and anim), and validates the resulting scene. " +
    "If `save` is provided, the scene is saved under that name; fails if the name exists unless `overwrite` is true.",
  input: z.object({
    compact: CompactSceneSchema,
    project: z.string().optional(),
    save: z.string().optional(),
    overwrite: z.boolean().optional(),
  }),
  output: z.object({
    scene: SceneSchema,
    saved: SceneResult.optional(),
  }),
  async run({ compact, project, save, overwrite }, ctx) {
    const { resolveProjectScope } = await import("../project-scope.ts");
    const { effectiveCtx } = await resolveProjectScope(ctx, project);

    let expanded: ReturnType<typeof checkScene>;
    try {
      const full = await expandScene(compact, {
        findPreset: async (name) => {
          try {
            const found = await findPreset(effectiveCtx, name);
            return found.recipe;
          } catch {
            return undefined;
          }
        },
        animLibrary: await (async () => {
          const { animLibrary } = await import("../scenes.ts");
          return animLibrary(effectiveCtx);
        })(),
      });
      expanded = checkScene(full);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      fail("invalid_compact_scene", msg, "compact");
    }

    let saved: z.infer<typeof SceneResult> | undefined;
    if (save) {
      if (!overwrite && (await effectiveCtx.store.readScene(save)) !== undefined) {
        fail("exists", `Ya existe la escena «${slugify(save)}»`, "save");
      }
      saved = await saveScene(effectiveCtx, save, expanded);
    }

    return {
      scene: expanded,
      saved,
    };
  },
});
