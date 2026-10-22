import type { ExportOptions } from "../export/export.ts";
import type { Scene } from "../model/model.ts";
import type { Ctx } from "./ctx.ts";
import type { Rendered } from "./renderer.ts";
import { openScene } from "./scenes.ts";

const GIF_MAX_FPS = 25;

export type ResolveAndRenderOptions = Omit<ExportOptions, "fps"> & {
  fps?: number;
};

export interface ResolvedRenderResult {
  scene: Scene;
  rendered: Rendered;
}

/**
 * Resolves a scene from name or direct Scene object and renders it via ctx.renderer.
 * Shared helper for scene_export, scene_preview, and offscreen headless renders (039/R4, D4).
 */
export async function resolveAndRenderScene(
  ctx: Ctx,
  sceneInput: string | Scene,
  options: ResolveAndRenderOptions,
): Promise<ResolvedRenderResult> {
  const scene =
    typeof sceneInput === "string"
      ? await openScene(ctx, sceneInput)
      : sceneInput;

  const effectiveFps =
    options.fps ??
    (options.format === "gif" ? Math.min(scene.fps, GIF_MAX_FPS) : scene.fps);

  const rendered = await ctx.renderer.render(scene, {
    ...options,
    fps: effectiveFps,
  });
  return { scene, rendered };
}
