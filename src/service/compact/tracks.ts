/**
 * Keyframe tracks normalizer for compact scenes (011/D1, T003).
 * Turns compact [t, value, easing?] tuples or partial objects into canonical Keyframe objects.
 */
import type { Easing } from "../../engine/easing.ts";
import type { Keyframe, Tracks } from "../../model/track.ts";

export type CompactKeyframeTuple = readonly [
  t: number,
  value: number | string,
  easing?: Easing,
];

export type CompactKeyframeInput =
  | CompactKeyframeTuple
  | { t: number; value: number | string; easing?: Easing };

export function normalizeKeyframe(k: CompactKeyframeInput): Keyframe {
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
  rawTracks: Record<string, CompactKeyframeInput[]>,
): Tracks {
  const result: Tracks = {};
  for (const [path, keys] of Object.entries(rawTracks)) {
    result[path] = keys.map(normalizeKeyframe);
  }
  return result;
}
