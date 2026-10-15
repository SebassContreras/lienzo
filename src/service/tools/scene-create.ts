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
    project: z.string().optional(),
    scene: z.record(z.string(), z.unknown()).optional(),
    overwrite: z.boolean().optional(),
  }),
  output: SceneResult,
  async run({ name, project, scene, overwrite }, ctx) {
    const effectiveCtx = project
      ? {
          ...ctx,
          store: await ctx.projects.projectStore(project),
        }
      : ctx;

    if (!overwrite && (await effectiveCtx.store.readScene(name)) !== undefined)
      fail("exists", `Ya existe la escena «${slugify(name)}»`, "name");

    let defaults = defaultScene();
    if (project) {
      const p = await ctx.projects.get(project);
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
    }

    return saveScene(effectiveCtx, name, { ...defaults, ...scene });
  },
});
