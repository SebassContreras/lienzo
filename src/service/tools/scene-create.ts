import { z } from "zod";
import { defaultScene } from "../../model/model.ts";
import { slugify } from "../../presets/slug.ts";
import { inProject, PROJECT } from "../project-scope.ts";
import { defineTool, fail } from "../registry.ts";
import { SceneResult, saveScene } from "../scenes.ts";

export const sceneCreate = defineTool({
  name: "scene_create",
  description:
    "Create scene `scene` in the project's scenes/. Fields given in `data` (width, height, duration, fps, " +
    "background, elements, mode) replace the defaults: an empty 1080x1080, 4 s, 30 fps scene. " +
    "`mode` can be 'static' (graphic post/image) or 'video' (animated video, default). " +
    "Elements may name an animation preset in `animPreset`; it is copied in. Fails if the " +
    "name is taken unless `overwrite` is true. `data` is a full scene: every element and " +
    "the background whole, as scene_get returns them; for the compact form (a color as " +
    "background, partial elements, `at`) use scene_build with `save`.",
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

    let defaults = defaultScene();
    const p = await ctx.projects.get(effectiveCtx.project);
    if (p) {
      defaults = {
        ...defaults,
        width: p.manifest.canvas.width,
        height: p.manifest.canvas.height,
        fps: p.manifest.canvas.fps,
        duration: p.manifest.canvas.duration,
        background: {
          ...defaults.background,
          color: p.manifest.palette.background ?? defaults.background.color,
        },
      };
    }

    const sceneData = { ...defaults, ...(mode ? { mode } : {}), ...data };
    return saveScene(effectiveCtx, scene, sceneData);
  },
});
