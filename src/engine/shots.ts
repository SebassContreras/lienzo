/**
 * Pure functions for shot timing, activation intervals, and camera view transforms (055/D1, D2).
 */
import type { Element, Scene, Shot } from "../model/model.ts";
import type { Box } from "./geometry.ts";
import type { Ctx } from "./paint.ts";
import { valueAt } from "./tracks.ts";

/** How shots behave, for tool descriptions (064/D2): the window `isElementActiveInShot` opens and the per-element camera. */
export const SHOT_RULES =
  "A shot shows its elements over [start, end): at a cut the next shot owns the instant, and " +
  "the scene's last instant stays with the shot ending there. A shot's transition runs before its `start` (entering) and after its `end` (leaving), " +
  "over its `duration`; its camera moves only the elements bound to that shot (`shot` on the " +
  "element), never elements with no shot such as subtitles or logos.";

export type ResolvedCamera = {
  x: number;
  y: number;
  zoom: number;
};

/**
 * Returns whether an element bound to a shot (or unbounded) is active at time `t`.
 * Top-level elements without `shot` are active throughout the scene.
 * Elements with `shot` are active within [shot.start, shot.end) + transition overlap: at a cut
 * the next shot owns the instant (073/D2). A shot reaching the scene's end keeps `t = end`,
 * so the last frame still shows it.
 */
export function isElementActiveInShot(
  el: Element,
  t: number,
  shots?: readonly Shot[],
  duration = Number.POSITIVE_INFINITY,
): boolean {
  if (!el.shot) return true;
  if (!shots || shots.length === 0) return true;

  const shot = shots.find((s) => s.id === el.shot);
  if (!shot) return false;

  const transDuration = shot.transition?.duration ?? 0;
  const start = Math.max(0, shot.start - transDuration);
  const end = shot.end + transDuration;

  return t >= start && (t < end || (end >= duration && t === end));
}

/**
 * Resolves camera parameters (x, y, zoom) for a given shot at time `t`.
 */
export function resolveShotCamera(
  shot: Shot | undefined,
  t: number,
): ResolvedCamera {
  if (!shot?.camera) {
    return { x: 0, y: 0, zoom: 1 };
  }

  const cam = shot.camera;
  let x = cam.x ?? 0;
  let y = cam.y ?? 0;
  let zoom = cam.zoom ?? 1;

  if (cam.tracks) {
    if (cam.tracks.x) {
      const vx = valueAt(cam.tracks.x, t, "number");
      if (typeof vx === "number") x = vx;
    }
    if (cam.tracks.y) {
      const vy = valueAt(cam.tracks.y, t, "number");
      if (typeof vy === "number") y = vy;
    }
    if (cam.tracks.zoom) {
      const vz = valueAt(cam.tracks.zoom, t, "number");
      if (typeof vz === "number" && vz > 0) zoom = vz;
    }
  }

  return { x, y, zoom };
}

/**
 * Applies 2D camera view transformation around stage center:
 * translates by scene center + camera offset, scales by camera zoom,
 * and translates back by scene center.
 */
export function applyCameraTransform(
  ctx: {
    save: () => void;
    translate: (x: number, y: number) => void;
    scale: (x: number, y: number) => void;
  },
  camera: ResolvedCamera,
  sceneWidth: number,
  sceneHeight: number,
): void {
  if (camera.x === 0 && camera.y === 0 && camera.zoom === 1) {
    return;
  }
  const cx = sceneWidth / 2;
  const cy = sceneHeight / 2;
  ctx.translate(cx + camera.x, cy + camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-cx, -cy);
}

export type TransitionView = { alpha: number; dx: number; scale: number };

const NO_TRANSITION: TransitionView = { alpha: 1, dx: 0, scale: 1 };

/**
 * What a shot's own transition does to it at `t`, inside the window `isElementActiveInShot`
 * opens: it enters over `[start − d, start]` and leaves over `[end, end + d]`. `fade` drives
 * alpha, `slide` comes in from the right and leaves to the left, `zoom` grows from 0.8 while
 * fading (063/D2, after Remotion's presentations).
 */
export function shotTransitionAt(
  shot: Shot,
  t: number,
  sceneWidth: number,
): TransitionView {
  const kind = shot.transition?.kind ?? "cut";
  const d = shot.transition?.duration ?? 0;
  if (kind === "cut" || d <= 0) return NO_TRANSITION;
  const entering = t < shot.start;
  const shown = entering
    ? clamp01((t - (shot.start - d)) / d)
    : clamp01(1 - (t - shot.end) / d);
  if (kind === "fade") return { ...NO_TRANSITION, alpha: shown };
  if (kind === "zoom") return { alpha: shown, dx: 0, scale: 0.8 + 0.2 * shown };
  const away = sceneWidth * (1 - shown);
  return { ...NO_TRANSITION, dx: entering ? away : -away };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Wraps one element's draw in what its shot does to it on screen (063/D1). */
export type ShotView = (
  ctx: Ctx,
  el: Element,
  scene: Scene,
  t: number,
  draw: () => void,
) => void;

/**
 * Applies an element's own shot transition and camera around its draw. Elements with no
 * `shot` are drawn as they are, so overlays such as subtitles and logos stay put (063/D1, D2).
 */
export const withShotView: ShotView = (ctx, el, scene, t, draw) => {
  const shot = el.shot ? scene.shots?.find((s) => s.id === el.shot) : undefined;
  if (!shot) {
    draw();
    return;
  }
  const { alpha, dx, scale } = shotTransitionAt(shot, t, scene.width);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(dx, 0);
  applyCameraTransform(
    ctx,
    { x: 0, y: 0, zoom: scale },
    scene.width,
    scene.height,
  );
  applyCameraTransform(
    ctx,
    resolveShotCamera(shot, t),
    scene.width,
    scene.height,
  );
  draw();
  ctx.restore();
};

/** Where `box` lands under `camera`: the pure counterpart of `applyCameraTransform`. */
export function cameraBox(
  box: Box,
  camera: ResolvedCamera,
  sceneWidth: number,
  sceneHeight: number,
): Box {
  const cx = sceneWidth / 2;
  const cy = sceneHeight / 2;
  return {
    x: cx + camera.x + (box.x - cx) * camera.zoom,
    y: cy + camera.y + (box.y - cy) * camera.zoom,
    w: box.w * camera.zoom,
    h: box.h * camera.zoom,
  };
}

/**
 * Where `box`, drawn by the top-level `el`, shows on screen at `t`: what `withShotView` does
 * to it, its shot's transition around its camera (067/D2).
 */
export function shotBox(box: Box, el: Element, scene: Scene, t: number): Box {
  const shot = el.shot ? scene.shots?.find((s) => s.id === el.shot) : undefined;
  if (!shot) return box;
  const { dx, scale } = shotTransitionAt(shot, t, scene.width);
  const seen = cameraBox(
    cameraBox(box, resolveShotCamera(shot, t), scene.width, scene.height),
    { x: 0, y: 0, zoom: scale },
    scene.width,
    scene.height,
  );
  return { ...seen, x: seen.x + dx };
}
