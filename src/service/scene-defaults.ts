/**
 * The scene every scene-making tool starts from (074/D3): the editor's default scene on the
 * project's canvas (size, duration, fps) and palette background, so `scene_create` and
 * `scene_build` (saved or not) agree.
 */
import { withElementDefaults } from "../model/fill-defaults.ts";
import { defaultScene, type Scene } from "../model/model.ts";
import { deepMerge } from "../presets/resolve.ts";
import type { ProjectCtx } from "./ctx.ts";

export async function sceneDefaults(ctx: ProjectCtx): Promise<Scene> {
  const scene = defaultScene();
  const project = await ctx.projects.get(ctx.project);
  if (!project) return scene;
  const { canvas, palette } = project.manifest;
  return {
    ...scene,
    width: canvas.width,
    height: canvas.height,
    fps: canvas.fps,
    duration: canvas.duration,
    background: {
      ...scene.background,
      color: palette.background ?? scene.background.color,
    },
  };
}

/**
 * `data` (a scene object, possibly partial) laid over `sceneDefaults`: missing scene fields
 * from the project, a partial `background` merged (068/D6), partial elements filled from
 * their kind's defaults (074/D9). Shared by `scene_create` and `scene_validate`.
 */
export async function sceneFromData(
  ctx: ProjectCtx,
  data: Record<string, unknown>,
): Promise<unknown> {
  const defaults = await sceneDefaults(ctx);
  const out: Record<string, unknown> = { ...defaults, ...data };
  const bg = data.background;
  if (typeof bg === "object" && bg !== null && !Array.isArray(bg)) {
    const merged = structuredClone(defaults.background);
    deepMerge(
      merged as unknown as Record<string, unknown>,
      bg as Record<string, unknown>,
    );
    out.background = merged;
  }
  return withElementDefaults(out);
}
