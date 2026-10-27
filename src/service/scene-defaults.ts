/**
 * The scene every scene-making tool starts from (074/D3): the editor's default scene on the
 * project's canvas (size, duration, fps) and palette background, so `scene_create` and
 * `scene_build` (saved or not) agree.
 */
import { defaultScene, type Scene } from "../model/model.ts";
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
