import { z } from "zod";
import { slugify } from "../../../presets/slug.ts";
import { storedAsNotice } from "../../project-files.ts";
import { inProject, PROJECT } from "../../project-scope.ts";
import { defineTool, fail } from "../../registry.ts";
import { sceneFromData } from "../scene-defaults.ts";
import { SceneResult, saveScene } from "../scenes.ts";

export const sceneCreate = defineTool({
  name: "scene_create",
  description:
    "Create scene `scene` in the project's scenes/. Fields given in `data` (width, height, duration, fps, " +
    "background, elements, mode) replace the defaults: an empty scene on the project's canvas (size, duration, fps and palette background, see project_inspect). " +
    "`mode` can be 'static' (graphic post/image) or 'video' (animated video, default). " +
    "Elements may name an animation preset in `animPreset`; it is copied in. Fails if the " +
    "name is taken unless `overwrite` is true. `data` is a scene as scene_get returns it: each " +
    "element needs `id` and `kind`, and the fields it leaves out take its kind's defaults; a " +
    "`background` may be a color (`#111827`, a solid background), a background preset name or a partial object " +
    "(the rest is the default's, solid when the project's palette sets a background; anything else fails). For the " +
    "compact form (a color as background, partial elements, `at`) use scene_build with `save`.",
  input: z.object({
    scene: z.string().min(1),
    project: PROJECT,
    mode: z.enum(["static", "video"]).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    overwrite: z.boolean().optional(),
  }),
  output: SceneResult,
  async run({ scene, project, mode, data, overwrite }, ctx) {
    const effectiveCtx = await inProject(ctx, project);

    if (!overwrite && (await effectiveCtx.store.readScene(scene)) !== undefined)
      fail("exists", `Ya existe la escena «${slugify(scene)}»`, "scene");

    const sceneData = await sceneFromData(effectiveCtx, {
      ...(mode ? { mode } : {}),
      ...data,
    });
    const result = await saveScene(effectiveCtx, scene, sceneData);
    result.notices.push(...storedAsNotice(scene, result.scene));
    return result;
  },
});
