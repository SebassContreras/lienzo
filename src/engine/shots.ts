/**
 * Pure functions for shot timing, activation intervals, and camera view transforms (055/D1, D2).
 */
import type { Element, Shot } from "../model/model.ts";
import { valueAt } from "./tracks.ts";

export type ResolvedCamera = {
  x: number;
  y: number;
  zoom: number;
};

/**
 * Returns whether an element bound to a shot (or unbounded) is active at time `t`.
 * Top-level elements without `shot` are active throughout the scene.
 * Elements with `shot` are active within [shot.start, shot.end] + transition overlap.
 */
export function isElementActiveInShot(
  el: Element,
  t: number,
  shots?: readonly Shot[],
): boolean {
  if (!el.shot) return true;
  if (!shots || shots.length === 0) return true;

  const shot = shots.find((s) => s.id === el.shot);
  if (!shot) return false;

  const transDuration = shot.transition?.duration ?? 0;
  const start = Math.max(0, shot.start - transDuration);
  const end = shot.end + transDuration;

  return t >= start && t <= end;
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
 * Finds the active shot at time `t` in the scene.
 */
export function findActiveShot(
  shots: readonly Shot[] | undefined,
  t: number,
): Shot | undefined {
  if (!shots || shots.length === 0) return undefined;
  return shots.find((s) => t >= s.start && t <= s.end);
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
