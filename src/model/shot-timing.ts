/**
 * When a shot-bound element animates (075/D1): its tracks are timed from its shot's `start`,
 * and an unbound element's from 0, as `anim` already is. So binding, rebinding or unbinding an
 * element, or moving a shot, carries the tracks along, as an NLE clip carries its keyframes.
 * Shared by the tools and the editor. Pure.
 */
import { mapElementsDeep } from "./element-walk.ts";
import type { Element, Shot } from "./model.ts";
import {
  type Keyframe,
  type Track,
  type Tracks,
  trackEntry,
  trackKeys,
  trackRepeat,
  trackUntil,
} from "./track.ts";

type ShotStart = Pick<Shot, "id" | "start">;

/** Where an element bound to shot `id` starts its time: the shot's `start`, else 0. */
export function shotOrigin(
  shots: readonly ShotStart[] | undefined,
  id: string | undefined,
): number {
  return (id && shots?.find((sh) => sh.id === id)?.start) || 0;
}

const at = (t: number) => Math.max(0, Math.round(t * 1000) / 1000);

/** `track` moved by `delta` s; a key pushed below 0 lands on 0, the last one there wins. */
function shiftTrack(track: Track, delta: number): Track {
  const keys: Keyframe[] = [];
  for (const k of trackKeys(track)) {
    const moved = { ...k, t: at(k.t + delta) };
    if (keys.at(-1)?.t === moved.t) keys.pop();
    keys.push(moved);
  }
  const until = trackUntil(track);
  return trackEntry(
    keys,
    trackRepeat(track),
    until === undefined ? undefined : at(until + delta),
  );
}

/** `tracks` with the tracks on `paths` (all when omitted) moved by `delta` seconds. */
export function shiftTracks(
  tracks: Tracks,
  delta: number,
  paths: readonly string[] = Object.keys(tracks),
): Tracks {
  if (delta === 0) return tracks;
  const out: Tracks = { ...tracks };
  for (const path of paths) {
    const track = out[path];
    if (track) out[path] = shiftTrack(track, delta);
  }
  return out;
}

/** `el` and everything inside it with every track moved by `delta` seconds. */
export function shiftElementTracks(el: Element, delta: number): Element {
  if (delta === 0) return el;
  const [out] = mapElementsDeep([el], (e) =>
    e.tracks ? { ...e, tracks: shiftTracks(e.tracks, delta) } : e,
  );
  return out as Element;
}

/**
 * `el` bound to shot `to` (unbound when undefined), its tracks (children's included) moved
 * from its old shot's origin to the new one's. `delta` is how far they moved.
 */
export function rebindShot(
  el: Element,
  to: string | undefined,
  shots: readonly ShotStart[] | undefined,
): { el: Element; delta: number } {
  const delta = shotOrigin(shots, to) - shotOrigin(shots, el.shot);
  const { shot: _old, ...rest } = shiftElementTracks(el, delta);
  return {
    el: (to === undefined ? rest : { ...rest, shot: to }) as Element,
    delta,
  };
}

/** A notice naming the elements whose tracks moved and by how much. */
export function movedNotice(moved: readonly { id: string; delta: number }[]) {
  const shown = moved.filter((m) => m.delta !== 0);
  if (shown.length === 0) return undefined;
  return `Las pistas se movieron con su toma: ${shown
    .map((m) => `«${m.id}» ${m.delta > 0 ? "+" : ""}${m.delta}s`)
    .join(", ")}`;
}
