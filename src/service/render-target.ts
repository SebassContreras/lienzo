import type { ExportOptions } from "../export/export.ts";
import type { Scene } from "../model/model.ts";
import type { ProjectCtx } from "./ctx.ts";
import { fail } from "./registry.ts";
import type { Rendered } from "./renderer.ts";
import { resourceNotices } from "./scenes/scene-resources.ts";
import { openScene } from "./scenes/scenes.ts";

const GIF_MAX_FPS = 25;

export type ResolveAndRenderOptions = Omit<ExportOptions, "fps"> & {
  fps?: number;
};

export interface ResolvedRenderResult {
  scene: Scene;
  rendered: Rendered;
}

/** Fails `invalid_time` at `path` when `t` is past the scene's duration (069/D9, 081/D11). */
export function assertTimeWithin(scene: Scene, t: number, path: string): void {
  if (t > scene.duration)
    fail("invalid_time", `t pasa la duración (${scene.duration}s)`, path);
}

/**
 * Resolves a scene from name or direct Scene object and renders it via ctx.renderer, with
 * the fonts of `ctx.project` (045/D3).
 * Shared helper for scene_export, scene_preview, and offscreen headless renders (039/R4, D4).
 */
export async function resolveAndRenderScene(
  ctx: ProjectCtx,
  sceneInput: string | Scene,
  options: ResolveAndRenderOptions,
): Promise<ResolvedRenderResult> {
  const scene =
    typeof sceneInput === "string"
      ? await openScene(ctx, sceneInput)
      : sceneInput;
  // a still past the end shows the last frame; say so rather than draw it (069/D9)
  if (options.format === "png") assertTimeWithin(scene, options.time ?? 0, "t");

  const effectiveFps =
    options.fps ??
    (options.format === "gif" ? Math.min(scene.fps, GIF_MAX_FPS) : scene.fps);

  const rendered = await ctx.renderer.render(
    scene,
    { ...options, fps: effectiveFps },
    ctx.project,
  );
  return { scene, rendered };
}

/** What `scene` names that the project lacks, as every scene write reports it (081/D6). */
export const missingAssetNotices = (ctx: ProjectCtx, scene: Scene) =>
  resourceNotices(ctx, scene);
