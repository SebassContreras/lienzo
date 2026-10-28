/**
 * The scene every scene-making tool starts from (074/D3): the editor's default scene on the
 * project's canvas (size, duration, fps) and palette background, so `scene_create` and
 * `scene_build` (saved or not) agree.
 */
import { defaultScene, type Scene } from "../../model/model.ts";
import { deepMerge } from "../../presets/resolve.ts";
import { solidBackground } from "../../traits/solid.ts";
import { resolveSceneBackground } from "../compact/expand.ts";
import type { ProjectCtx } from "../ctx.ts";
import { fail } from "../registry.ts";
import { findPreset } from "./scenes.ts";

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
    background: palette.background
      ? solidBackground(scene.background, palette.background)
      : scene.background,
  };
}

/**
 * `data` (a scene object, possibly partial) laid over `sceneDefaults`: missing scene fields
 * from the project and a partial `background` merged (068/D6). Partial elements are filled
 * by `prepareScene` (080/D2). Shared by `scene_create`, `scene_validate` and
 * `scene_inspect_layout`.
 */
export async function sceneFromData(
  ctx: ProjectCtx,
  data: Record<string, unknown>,
): Promise<unknown> {
  const defaults = await sceneDefaults(ctx);
  const out: Record<string, unknown> = { ...defaults, ...data };
  const bg = data.background;
  if (typeof bg === "string") {
    // a color or a background preset, as `scene_build` reads it (065/D1)
    const notices: string[] = [];
    out.background = await resolveSceneBackground(
      bg,
      notices,
      async (name) => {
        try {
          return (await findPreset(ctx, name)).recipe;
        } catch {
          return undefined;
        }
      },
      defaults.background,
    );
    if (notices[0]) fail("invalid_input", notices[0], "data.background");
  } else if (typeof bg === "object" && bg !== null && !Array.isArray(bg)) {
    const merged = structuredClone(defaults.background);
    deepMerge(
      merged as unknown as Record<string, unknown>,
      bg as Record<string, unknown>,
    );
    out.background = merged;
  }
  return out;
}
