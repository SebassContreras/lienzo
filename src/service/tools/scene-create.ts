import { z } from "zod";
import { defaultScene } from "../../model/model.ts";
import { slugify } from "../../presets/slug.ts";
import { defineTool, fail } from "../registry.ts";
import { SceneResult, saveScene } from "../scenes.ts";

export const sceneCreate = defineTool({
  name: "scene_create",
  description:
    "Create a scene in scenes/. Fields given in `scene` (width, height, duration, fps, " +
    "background, elements) replace the defaults: an empty 1080x1080, 4 s, 30 fps scene. " +
    "Elements may name an animation preset in `animPreset`; it is copied in. Fails if the " +
    "name is taken unless `overwrite` is true.",
  input: z.object({
    name: z.string().min(1),
    scene: z.record(z.string(), z.unknown()).optional(),
    overwrite: z.boolean().optional(),
  }),
  output: SceneResult,
  async run({ name, scene, overwrite }, ctx) {
    if (!overwrite && (await ctx.store.readScene(name)) !== undefined)
      fail("exists", `Ya existe la escena «${slugify(name)}»`, "name");
    return saveScene(ctx, name, { ...defaultScene(), ...scene });
  },
});
