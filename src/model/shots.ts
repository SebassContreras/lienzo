/**
 * Editing a scene's shots: the one set of rules `shot_set` and the editor share, so both
 * write the same JSON (062/D1). Pure: they return new arrays and never touch the input.
 */
import { resolveShotCamera } from "../engine/shots.ts";
import { keyframeAt, withKeyframe } from "../engine/tracks.ts";
import { deepMerge } from "../presets/resolve.ts";
import { mapElementsDeep } from "./element-walk.ts";
import type { Element, Shot, ShotCamera, ShotTransition } from "./model.ts";
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

/** `elements` with no element (at any depth) bound to shot `id`, and the ids it unbound (069/D4). */
export function unbindShot(
  elements: readonly Element[],
  id: string,
): { elements: Element[]; unbound: string[] } {
  const unbound: string[] = [];
  const out = mapElementsDeep(elements, (el) => {
    if (el.shot !== id) return el;
    unbound.push(el.id);
    const { shot: _shot, ...rest } = el;
    return rest as Element;
  });
  return { elements: out, unbound };
}

/**
 * `el` with its tracks on `paths` moved from shot time to scene time (074/D4): a preset's
 * tracks start at 0, so on an element bound to a shot they start at the shot's `start`.
 * Unchanged when the element has no shot or the shot is not in `shots`.
 */
export function fromShotStart(
  el: Element,
  paths: readonly string[],
  shots: readonly Pick<Shot, "id" | "start">[] | undefined,
): Element {
  const start = shots?.find((sh) => sh.id === el.shot)?.start ?? 0;
  if (start === 0 || !el.tracks) return el;
  const tracks: Tracks = { ...el.tracks };
  for (const path of paths) {
    const track = tracks[path];
    if (!track) continue;
    const until = trackUntil(track);
    tracks[path] = trackEntry(
      trackKeys(track).map((k) => ({ ...k, t: k.t + start })),
      trackRepeat(track),
      until === undefined ? undefined : until + start,
    );
  }
  return { ...el, tracks };
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
