/**
 * Editing a scene's shots: the one set of rules `shot_set` and the editor share, so both
 * write the same JSON (062/D1). Pure: they return new arrays and never touch the input.
 */
import { resolveShotCamera } from "../engine/shots.ts";
import { keyframeAt, withKeyframe } from "../engine/tracks.ts";
import { deepMerge } from "../presets/resolve.ts";
import { mapElementsDeep } from "./element-walk.ts";
import type {
  Element,
  Scene,
  Shot,
  ShotCamera,
  ShotTransition,
} from "./model.ts";
import {
  rebindShot,
  shiftElementTracks,
  shiftTracks,
  shotOrigin,
} from "./shot-timing.ts";
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

/** Removes the shot `id` from `shots`; `removeShotIn` also unbinds its elements. */
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

/**
 * Why `shots` cannot stand in a scene of `duration` seconds (069/D5): a shot ending after the
 * scene, or two shots whose `[start, end)` windows intersect. Undefined when they fit.
 */
export function shotProblem(
  shots: readonly Shot[],
  duration: number,
): ShotError | undefined {
  const late = shots.find((sh) => sh.end > duration);
  if (late)
    return {
      code: "invalid_input",
      message: `La toma «${late.id}» termina en ${late.end}s, después de la escena (${duration}s)`,
      path: "end",
    };
  const sorted = [...shots].sort((a, b) => a.start - b.start);
  for (const [i, sh] of sorted.entries()) {
    const next = sorted[i + 1];
    if (next && next.start < sh.end)
      return {
        code: "invalid_input",
        message: `La toma «${next.id}» (${next.start}–${next.end}s) se solapa con «${sh.id}» (${sh.start}–${sh.end}s)`,
        path: "start",
      };
  }
  return undefined;
}

/** A scene edit of its shots, and the elements whose tracks moved with them (075/D2). */
export type SceneShotsResult =
  | {
      scene: Scene;
      moved: { id: string; delta: number }[];
      unbound: string[];
    }
  | { error: ShotError };

/** How far `patch` moves `shot` whole: the shift of its start when its length stays, else 0. */
function moveOf(shot: Shot, patch: ShotPatch): number {
  const start = patch.start ?? shot.start;
  const end = patch.end ?? shot.end;
  const same = Math.abs(end - start - (shot.end - shot.start)) < 1e-9;
  return same ? start - shot.start : 0;
}

const withShots = (scene: Scene, shots: Shot[]): Scene => ({
  ...scene,
  shots: shots.length > 0 ? shots : undefined,
});

/**
 * `scene` with shot `patch.id` created or updated, as `shot_set` and the editor's shots section
 * do: the shots must fit the scene (069/D5). Moving a shot (`start` and `end` shifted by the
 * same amount) moves its camera keys and the tracks of the elements bound to it (075/R2);
 * trimming one edge leaves them in place, as an NLE does (078/D2). A `camera` in the patch is
 * taken as given.
 */
export function setShotIn(scene: Scene, patch: ShotPatch): SceneShotsResult {
  const shots = scene.shots ?? [];
  const old = shots.find((sh) => sh.id === patch.id);
  const delta = old ? moveOf(old, patch) : 0;
  const carried = shots.map((sh) =>
    sh === old && delta !== 0 && sh.camera?.tracks
      ? {
          ...sh,
          camera: {
            ...sh.camera,
            tracks: shiftTracks(sh.camera.tracks, delta),
          },
        }
      : sh,
  );
  const result = setShot(carried, patch);
  if ("error" in result) return result;
  const problem = shotProblem(result.shots, scene.duration);
  if (problem) return { error: problem };
  const moved: { id: string; delta: number }[] = [];
  const elements =
    delta === 0
      ? scene.elements
      : mapElementsDeep(scene.elements, (el) => {
          if (el.shot !== patch.id) return el;
          moved.push({ id: el.id, delta });
          return shiftElementTracks(el, delta);
        });
  return {
    scene: withShots({ ...scene, elements }, result.shots),
    moved,
    unbound: [],
  };
}

/**
 * `scene` without shot `id`; the elements bound to it (at any depth) are unbound, their tracks
 * moved back to the scene's origin (069/D4, 075/R3).
 */
export function removeShotIn(scene: Scene, id: string): SceneShotsResult {
  const result = removeShot(scene.shots ?? [], id);
  if ("error" in result) return result;
  const moved: { id: string; delta: number }[] = [];
  const unbound: string[] = [];
  const elements = mapElementsDeep(scene.elements, (el) => {
    if (el.shot !== id) return el;
    const rebound = rebindShot(el, undefined, scene.shots);
    unbound.push(el.id);
    moved.push({ id: el.id, delta: rebound.delta });
    return rebound.el;
  });
  return {
    scene: withShots({ ...scene, elements }, result.shots),
    moved,
    unbound,
  };
}

/**
 * `el` with its tracks on `paths` moved from shot time to scene time (074/D4): a preset's
 * tracks start at 0, so on an element bound to a shot they start at the shot's `start`.
 */
export function fromShotStart(
  el: Element,
  paths: readonly string[],
  shots: readonly Pick<Shot, "id" | "start">[] | undefined,
): Element {
  const start = shotOrigin(shots, el.shot);
  if (start === 0 || !el.tracks) return el;
  return { ...el, tracks: shiftTracks(el.tracks, start, paths) };
}

/**
 * A notice when `shot`'s camera has keyframes outside its `[start, end]` (074/D8): camera
 * times are scene time, so keys written from 0 in a later shot never play.
 */
export function cameraOutsideShot(shot: Shot): string | undefined {
  const outside = Object.entries(shot.camera?.tracks ?? {}).flatMap(
    ([axis, track]) =>
      trackKeys(track)
        .filter((k) => k.t < shot.start || k.t > shot.end)
        .map((k) => `${axis} en ${k.t}s`),
  );
  return outside.length > 0
    ? `La cámara de «${shot.id}» tiene keyframes fuera de la toma (${shot.start}–${shot.end}s): ${outside.join(", ")}; los tiempos de la cámara son de la escena, no de la toma`
    : undefined;
}
