/**
 * Animation presets (019/D7): pure functions that turn an element's animation into a preset
 * (times from 0, positions as offsets) and merge a preset back onto any element.
 */
import type { Fields } from "../components/fields/index.ts";
import { descriptorOf } from "../components/index.ts";
import { baseValue, fieldAt, valueKind } from "../engine/tracks.ts";
import type { AnimPreset, AnimSlots } from "../model/anim-preset.ts";
import type { Element } from "../model/model.ts";
import { isChannel, type Keyframe, type Tracks } from "../model/track.ts";

/** What a preset holds besides its name and category. */
export type PresetBody = Pick<AnimPreset, "anim" | "tracks">;

const SLOTS = ["in", "loop", "out"] as const;

type Slot = (typeof SLOTS)[number];

/**
 * The slots whose delay is a start time: entry and exit, and a loop that ends; a loop that
 * repeats forever uses its delay as a phase, which stays as it is.
 */
const timed = (anim: AnimSlots): Slot[] =>
  SLOTS.filter((s) =>
    s === "loop" ? anim.loop && anim.loop.iterations !== "infinite" : anim[s],
  );

/** True when `path` or an object holding it is a position (019/D6). */
function isRelative(fields: Fields, path: string): boolean {
  const parts = path.split(".");
  return parts.some(
    (_, i) => fieldAt(fields, parts.slice(0, i + 1).join("."))?.relative,
  );
}

const fieldsOf = (el: Element) => descriptorOf(el.kind)?.fields ?? {};

/** The offset a keyframe value moves by: the element's own value on positional paths. */
function offsetOf(el: Element, path: string): number {
  if (isChannel(path) || !isRelative(fieldsOf(el), path)) return 0;
  const v = baseValue(el, path);
  return typeof v === "number" ? v : 0;
}

const shifted = (keys: readonly Keyframe[], dt: number, dv: number) =>
  keys.map((k) => ({
    ...k,
    t: k.t + dt,
    value: typeof k.value === "number" ? k.value + dv : k.value,
  }));

/** The slots of `el` that do something (a `none` slot would wipe the target's). */
function activeSlots(el: Element): AnimSlots {
  const anim = (el as { anim?: AnimSlots }).anim ?? {};
  const out: Record<string, unknown> = {};
  for (const s of SLOTS) {
    const slot = anim[s];
    if (slot && slot.kind !== "none") out[s] = slot;
  }
  return out as AnimSlots;
}

function shiftDelays(anim: AnimSlots, dt: number): AnimSlots {
  const out = { ...anim };
  for (const s of timed(anim)) {
    const slot = out[s] as { delay: number };
    out[s] = { ...slot, delay: Math.max(0, slot.delay + dt) } as never;
  }
  return out;
}

/** The earliest moment `el` animates: its first keyframe or its entry or exit start. */
export function animStart(el: Element): number {
  const anim = activeSlots(el);
  const times = [
    ...Object.values(el.tracks ?? {}).flatMap((keys) => keys.map((k) => k.t)),
    ...timed(anim).map((s) => (anim[s] as { delay: number }).delay),
  ];
  return times.length ? Math.min(...times) : 0;
}

/** `el`'s animation as a preset body, its times counted from `start`. */
export function capturePreset(el: Element, start = animStart(el)): PresetBody {
  const body: PresetBody = {};
  const anim = shiftDelays(activeSlots(el), -start);
  if (Object.keys(anim).length) body.anim = anim;
  const tracks: Tracks = {};
  for (const [path, keys] of Object.entries(el.tracks ?? {})) {
    tracks[path] = shifted(keys, -start, -offsetOf(el, path)).map((k) => ({
      ...k,
      t: Math.max(0, k.t),
    }));
  }
  if (Object.keys(tracks).length) body.tracks = tracks;
  return body;
}

/** Whether `kind` can play in slot `s` of an element of `el`'s kind. */
function offers(el: Element, s: Slot, kind: string): boolean {
  const offer = descriptorOf(el.kind)?.anims;
  if (!offer) return false;
  const kinds: readonly string[] = s === "loop" ? offer.loops : offer.motions;
  return kinds.includes(kind);
}

/** Whether `keys` fit `path` of `el`: the field exists and the values are its type. */
function fits(el: Element, path: string, keys: readonly Keyframe[]): boolean {
  if (!isChannel(path) && !fieldAt(fieldsOf(el), path)) return false;
  const wantsColor = valueKind(el.kind, path) === "color";
  return keys.every((k) => (typeof k.value === "string") === wantsColor);
}

/**
 * `preset` merged onto `el` starting at `start`: each slot and track path it has replaces
 * the element's, the rest stay. `skipped` lists what `el` cannot take ("anim.in", "x").
 */
export function applyPreset(
  el: Element,
  preset: PresetBody,
  start: number,
): { el: Element; skipped: string[] } {
  const skipped: string[] = [];
  let out = el;
  const anim = shiftDelays(preset.anim ?? {}, start);
  const slots: Record<string, unknown> = {};
  for (const s of SLOTS) {
    const slot = anim[s];
    if (!slot) continue;
    if (offers(el, s, slot.kind)) slots[s] = slot;
    else skipped.push(`anim.${s}`);
  }
  if (Object.keys(slots).length) {
    const own = (el as { anim?: object }).anim;
    out = { ...out, anim: { ...own, ...slots } } as Element;
  }
  const tracks: Tracks = {};
  for (const [path, keys] of Object.entries(preset.tracks ?? {})) {
    if (fits(el, path, keys))
      tracks[path] = shifted(keys, start, offsetOf(el, path));
    else skipped.push(path);
  }
  if (Object.keys(tracks).length)
    out = { ...out, tracks: { ...el.tracks, ...tracks } };
  return { el: out, skipped };
}
