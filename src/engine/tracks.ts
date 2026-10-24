/**
 * Keyframe tracks (015/D6): the one module that evaluates them and edits them. The service
 * tools (007) and animation presets (019) go through it too.
 */

import type { DataField, Fields } from "../components/fields/index.ts";
import { descriptorOf } from "../components/index.ts";
import type { Element } from "../model/model.ts";
import {
  CHANNELS,
  type Channel,
  isChannel,
  type Keyframe,
  type Track,
  type TrackRepeat,
  trackEntry,
  trackKeys,
  trackRepeat,
  trackUntil,
} from "../model/track.ts";
import { EASINGS, easingFn } from "./easing.ts";
import { mixColor } from "./paint.ts";

/** Keyframes closer than this (seconds, under half a frame at 60 fps) are the same one. */
const SAME_T = 1 / 120;

/** How a path's values blend between keyframes. */
export type ValueKind = "number" | "int" | "color";

/** The data field at `path` ("fill.color") among `fields`, if there is one. */
export function fieldAt(fields: Fields, path: string): DataField | undefined {
  const [head, ...rest] = path.split(".");
  const f = fields[head as string];
  if (!f || f.type === "widget") return undefined;
  if (rest.length === 0) return f;
  return f.type === "object" ? fieldAt(f.fields, rest.join(".")) : undefined;
}

/** How `path` of an element of `kind` blends: channels and plain numbers, whole numbers, colors. */
export function valueKind(kind: string, path: string): ValueKind {
  if (isChannel(path)) return "number";
  const f = fieldAt(descriptorOf(kind)?.fields ?? {}, path);
  if (f?.type === "color") return "color";
  return f?.type === "number" && f.int ? "int" : "number";
}

/**
 * Resolves the effective lookup timestamp for a track at `t` (052/D2):
 * clamps at `until` when set and `t >= until`, then wraps `t` past `last.t`
 * across `last.t - first.t` for `repeat: "loop"` or `"pingpong"`.
 */
export function effectiveTrackTime(
  keys: readonly Keyframe[],
  t: number,
  repeat: TrackRepeat = "none",
  until?: number,
): number {
  const clamped = until !== undefined && t >= until ? until : t;
  if (keys.length < 2 || repeat === "none") return clamped;
  const first = keys[0] as Keyframe;
  const last = keys[keys.length - 1] as Keyframe;
  const span = last.t - first.t;
  if (span <= 0 || clamped <= last.t) return clamped;
  const elapsed = clamped - first.t;
  const cycle = Math.floor(elapsed / span);
  const rem = elapsed - cycle * span;
  if (repeat === "loop") return first.t + rem;
  return cycle % 2 === 0 ? first.t + rem : last.t - rem;
}

/**
 * A track's value at `t`: held before the first keyframe and after the last (or wrapped by
 * `repeat` / `until`); between two, blended through the first one's easing (whole numbers
 * step at the next keyframe).
 */
export function valueAt(
  track: Track | readonly Keyframe[],
  t: number,
  kind: ValueKind,
): number | string | undefined {
  const keys = trackKeys(track);
  const first = keys[0];
  if (!first) return undefined;
  const effT = effectiveTrackTime(
    keys,
    t,
    trackRepeat(track),
    trackUntil(track),
  );
  if (effT <= first.t) return first.value;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i] as Keyframe;
    const b = keys[i + 1] as Keyframe;
    if (effT >= b.t) continue;
    if (kind === "int") return a.value;
    const k = easingFn(a.easing, EASINGS.linear)((effT - a.t) / (b.t - a.t));
    if (kind === "color") return mixColor(String(a.value), String(b.value), k);
    return Number(a.value) + (Number(b.value) - Number(a.value)) * k;
  }
  return (keys[keys.length - 1] as Keyframe).value;
}

/** `keys` with `kf` in time order, replacing a keyframe at the same moment. */
export function withKeyframe(
  keys: readonly Keyframe[],
  kf: Keyframe,
): Keyframe[] {
  const rest = keys.filter((k) => Math.abs(k.t - kf.t) >= SAME_T);
  return [...rest, kf].sort((a, b) => a.t - b.t);
}

/** `keys` with keyframe `i` moved to `t` (it replaces one already there). */
export function movedKeyframe(
  keys: readonly Keyframe[],
  i: number,
  t: number,
): Keyframe[] {
  const kf = keys[i];
  if (!kf) return [...keys];
  return withKeyframe(
    keys.filter((_, j) => j !== i),
    { ...kf, t: Math.max(0, t) },
  );
}

/** `keys` without keyframe `i`. */
export const withoutKeyframe = (keys: readonly Keyframe[], i: number) =>
  keys.filter((_, j) => j !== i);

/** The index of the keyframe at `t`, or -1. */
export const keyframeAt = (keys: readonly Keyframe[], t: number) =>
  keys.findIndex((k) => Math.abs(k.t - t) < SAME_T);

function getPath(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((v, k) => (v as Record<string, unknown>)?.[k], obj);
}

/** `el` with `value` at `path`, copying only the objects along the way. */
function setPath<E>(el: E, path: string, value: unknown): E {
  const [head, ...rest] = path.split(".") as [string, ...string[]];
  const obj = el as Record<string, unknown>;
  return {
    ...obj,
    [head]:
      rest.length === 0 ? value : setPath(obj[head], rest.join("."), value),
  } as E;
}

/** The value a path of `el` has with no track running: its field, or the channel's rest. */
export const baseValue = (el: Element, path: string) =>
  isChannel(path) ? CHANNELS[path] : getPath(el, path);

/** What `el`'s tracks make it at `t`: its fields set, and each channel's value. */
export function applyTracks<E extends Element>(
  el: E,
  t: number,
): { el: E; channels: Record<Channel, number> } {
  const channels: Record<Channel, number> = { ...CHANNELS };
  let out = el;
  for (const [path, keys] of Object.entries(el.tracks ?? {})) {
    const v = valueAt(keys, t, valueKind(el.kind, path));
    if (v === undefined) continue;
    if (isChannel(path)) channels[path] = Number(v);
    else out = setPath(out, path, v);
  }
  return { el: out, channels };
}

/**
 * Writes an edit of `path` made at `t` into `draft` (015/D6): it sets the keyframe at `t`
 * when the path has a track (and always for a channel, which has no field); otherwise
 * `writeField` writes the field itself.
 */
export function writeAt(
  draft: Element,
  path: string,
  value: number | string,
  t: number,
  writeField: (draft: Element, value: unknown) => void,
): void {
  const track = draft.tracks?.[path];
  if (!track && !isChannel(path)) {
    writeField(draft, value);
    return;
  }
  draft.tracks = {
    ...draft.tracks,
    [path]: trackEntry(
      setKeyframe(trackKeys(track), t, value),
      trackRepeat(track),
      trackUntil(track),
    ),
  };
}

/** `keys` with `value` at `t`, keeping the easing of a keyframe already there. */
function setKeyframe(
  keys: readonly Keyframe[],
  t: number,
  value: number | string,
): Keyframe[] {
  const easing = keys[keyframeAt(keys, t)]?.easing ?? "auto";
  return withKeyframe(keys, { t, value, easing });
}

/**
 * `edited`, made from `el` as it shows at `t` (a drag on the stage), written back onto
 * `el`: each tracked field it changed becomes a keyframe at `t` and keeps its base value;
 * everything else is taken as edited.
 */
export function commitAt(el: Element, edited: Element, t: number): Element {
  if (!el.tracks) return edited;
  const shown = applyTracks(el, t).el;
  let out: Element = { ...edited, tracks: el.tracks };
  for (const [path, track] of Object.entries(el.tracks)) {
    if (isChannel(path)) continue;
    const v = getPath(edited, path);
    out = setPath(out, path, getPath(el, path));
    if (v !== getPath(shown, path))
      out.tracks = {
        ...out.tracks,
        [path]: trackEntry(
          setKeyframe(trackKeys(track), t, v as number | string),
          trackRepeat(track),
          trackUntil(track),
        ),
      };
  }
  return out;
}

/**
 * Starts a track on `path` with a keyframe of its current value at `t`, or removes it,
 * leaving the field at the value the track had at `t` so nothing jumps.
 */
export function toggleTrack(draft: Element, path: string, t: number): void {
  const { [path]: track, ...rest } = draft.tracks ?? {};
  if (track) {
    const v = valueAt(track, t, valueKind(draft.kind, path));
    draft.tracks = rest;
    if (v !== undefined && !isChannel(path))
      Object.assign(draft, setPath(draft, path, v));
    return;
  }
  const value = baseValue(draft, path) as number | string;
  draft.tracks = { ...rest, [path]: [{ t, value, easing: "auto" }] };
}
