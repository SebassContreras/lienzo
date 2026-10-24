/**
 * Editing a scene's shots: the one set of rules `shot_set` and the editor share, so both
 * write the same JSON (062/D1). Pure: they return new arrays and never touch the input.
 */
import { resolveShotCamera } from "../engine/shots.ts";
import { keyframeAt, withKeyframe } from "../engine/tracks.ts";
import { deepMerge } from "../presets/resolve.ts";
import type { Shot, ShotCamera, ShotTransition } from "./model.ts";
import {
  type Tracks,
  trackEntry,
  trackKeys,
  trackRepeat,
  trackUntil,
} from "./track.ts";

export type ShotPatch = {
  id: string;
  name?: string;
  start?: number;
  end?: number;
  transition?: ShotTransition;
  camera?: ShotCamera;
};

export type ShotError = { code: string; message: string; path: string };

export type ShotsResult = { shots: Shot[] } | { error: ShotError };

/** Creates the shot `patch.id` (needs `start` and `end`) or updates it; sorted by `start`. */
export function setShot(shots: readonly Shot[], patch: ShotPatch): ShotsResult {
  const next: Shot[] = structuredClone([...shots]);
  const { id, name, start, end, transition, camera } = patch;
  const existing = next.find((sh) => sh.id === id);
  if (!existing) {
    if (start === undefined || end === undefined) {
      return {
        error: {
          code: "invalid_input",
          message: `Para crear la toma «${id}» se requieren 'start' y 'end'`,
          path: "start",
        },
      };
    }
    next.push({ id, name: name ?? id, start, end, transition, camera });
  } else {
    if (name !== undefined) existing.name = name;
    if (start !== undefined) existing.start = start;
    if (end !== undefined) existing.end = end;
    if (transition !== undefined) existing.transition = transition;
    if (camera !== undefined) {
      if (existing.camera) {
        deepMerge(
          existing.camera as unknown as Record<string, unknown>,
          camera as unknown as Record<string, unknown>,
        );
      } else {
        existing.camera = camera;
      }
    }
  }
  const shot = next.find((sh) => sh.id === id) as Shot;
  if (shot.end < shot.start) {
    return {
      error: {
        code: "invalid_input",
        message: `'end' (${shot.end}) no puede ser menor que 'start' (${shot.start})`,
        path: "end",
      },
    };
  }
  next.sort((a, b) => a.start - b.start);
  return { shots: next };
}

/** Removes the shot `id`; elements bound to it keep their `shot` field. */
export function removeShot(shots: readonly Shot[], id: string): ShotsResult {
  if (!shots.some((sh) => sh.id === id)) {
    return {
      error: {
        code: "not_found",
        message: `No se encontró la toma «${id}»`,
        path: "id",
      },
    };
  }
  return { shots: shots.filter((sh) => sh.id !== id) };
}

export type CameraAxis = "x" | "y" | "zoom";

/**
 * The `camera.tracks` patch that toggles a keyframe of `axis` at `t` (062/D9): removes the
 * key there, or adds one holding the camera's value at `t`. Pass it to `setShot` as
 * `camera: { tracks }`, the same patch `shot_set` takes.
 */
export function toggleCameraKey(
  shot: Shot,
  axis: CameraAxis,
  t: number,
): Tracks {
  const track = shot.camera?.tracks?.[axis];
  const keys = trackKeys(track);
  const at = keyframeAt(keys, t);
  const next =
    at >= 0
      ? keys.filter((_, i) => i !== at)
      : withKeyframe(keys, {
          t,
          value: resolveShotCamera(shot, t)[axis],
          easing: "auto",
        });
  return {
    [axis]: trackEntry(next, trackRepeat(track), trackUntil(track)),
  };
}

/**
 * The camera patch for `axis` set to `value` at `t`: a keyframe there when the axis is
 * animated (so the change shows), else the shot's still value.
 */
export function cameraValuePatch(
  shot: Shot,
  axis: CameraAxis,
  t: number,
  value: number,
): ShotCamera {
  const track = shot.camera?.tracks?.[axis];
  if (trackKeys(track).length === 0) return { [axis]: value };
  const keys = withKeyframe(trackKeys(track), { t, value, easing: "auto" });
  return {
    tracks: { [axis]: trackEntry(keys, trackRepeat(track), trackUntil(track)) },
  };
}
