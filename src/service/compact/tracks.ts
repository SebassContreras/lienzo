/**
 * Keyframe tracks normalizer for compact scenes (011/D1, T003).
 * Turns compact [t, value, easing?] tuples or partial objects into canonical Keyframe objects.
 */
import type { Easing } from "../../engine/easing.ts";
import type { ShotCamera } from "../../model/model.ts";
import {
  type Keyframe,
  type TrackRepeat,
  type Tracks,
  trackEntry,
} from "../../model/track.ts";

type CompactKeyframeTuple = readonly [
  t: number,
  value: number | string,
  easing?: Easing,
];

export type CompactKeyframeInput =
  | CompactKeyframeTuple
  | { t: number; value: number | string; easing?: Easing };

export type CompactTrackInput =
  | CompactKeyframeInput[]
  | {
      keys: CompactKeyframeInput[];
      repeat?: TrackRepeat;
      until?: number;
    };

function normalizeKeyframe(k: CompactKeyframeInput): Keyframe {
  if (Array.isArray(k)) {
    const [t, value, easing] = k;
    return {
      t,
      value,
      easing: easing ?? "auto",
    };
  }
  const obj = k as { t: number; value: number | string; easing?: Easing };
  return {
    t: obj.t,
    value: obj.value,
    easing: obj.easing ?? "auto",
  };
}

export function normalizeTracks(
  rawTracks: Record<string, CompactTrackInput>,
): Tracks {
  const result: Tracks = {};
  for (const [path, raw] of Object.entries(rawTracks)) {
    if (Array.isArray(raw)) {
      result[path] = raw.map(normalizeKeyframe);
    } else {
      result[path] = trackEntry(
        raw.keys.map(normalizeKeyframe),
        raw.repeat,
        raw.until,
      );
    }
  }
  return result;
}

/** A shot camera in the short form (`[t, value, easing?]` keys), as stored (074/D8). */
export function normalizeCamera(camera: {
  x?: number;
  y?: number;
  zoom?: number;
  tracks?: Record<string, unknown>;
}): ShotCamera {
  // only what is given, so a partial update merges onto the stored camera
  const { tracks, ...still } = camera;
  return tracks
    ? {
        ...still,
        tracks: normalizeTracks(tracks as Record<string, CompactTrackInput>),
      }
    : still;
}
