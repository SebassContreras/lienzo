/**
 * Animation presets (019/D7): pure functions that turn an element's animation into a preset
 * (times from 0, positions as offsets) and merge a preset back onto any element.
 */
import type { Fields } from "../components/fields/index.ts";
import { descriptorOf } from "../components/index.ts";
import { baseValue, fieldAt, valueKind } from "../engine/tracks.ts";
import type { AnimPreset, AnimSlots } from "../model/anim-preset.ts";
import type { Element, Scene } from "../model/model.ts";
import {
  isChannel,
  type Keyframe,
  type Tracks,
  trackEntry,
  trackKeys,
  trackRepeat,
  trackUntil,
} from "../model/track.ts";
import { slugify } from "./slug.ts";

/** What a preset holds besides its name and category. */
export type PresetBody = Pick<AnimPreset, "anim" | "tracks">;

/** A body to apply; with a `name`, applied elements remember it (019/D9). */
type Applied = PresetBody & { name?: string };

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
function animStart(el: Element): number {
  const anim = activeSlots(el);
  const times = [
    ...Object.values(el.tracks ?? {}).flatMap((track) =>
      trackKeys(track).map((k) => k.t),
    ),
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
  for (const [path, track] of Object.entries(el.tracks ?? {})) {
    const keys = shifted(trackKeys(track), -start, -offsetOf(el, path)).map(
      (k) => ({
        ...k,
        t: Math.max(0, k.t),
      }),
    );
    const until = trackUntil(track);
    tracks[path] = trackEntry(
      keys,
      trackRepeat(track),
      until !== undefined ? Math.max(0, until - start) : undefined,
    );
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
 * `preset` merged onto `el` starting at `start` (the copy remembers a named preset): each slot and track path it has replaces
 * the element's, the rest stay. `skipped` lists what `el` cannot take ("anim.in", "x").
 */
export function applyPreset(
  el: Element,
  preset: Applied,
  start: number,
): { el: Element; skipped: string[] } {
  const skipped: string[] = [];
  let out = el;
  // A copy: editing the preset later must not reach the element (R6).
  const anim = shiftDelays(structuredClone(preset.anim ?? {}), start);
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
  for (const [path, track] of Object.entries(preset.tracks ?? {})) {
    const keys = trackKeys(track);
    if (fits(el, path, keys)) {
      const until = trackUntil(track);
      tracks[path] = trackEntry(
        shifted(keys, start, offsetOf(el, path)),
        trackRepeat(track),
        until !== undefined ? until + start : undefined,
      );
    } else skipped.push(path);
  }
  if (Object.keys(tracks).length)
    out = { ...out, tracks: { ...el.tracks, ...tracks } };
  if (preset.name) out = { ...out, animPreset: { name: preset.name, start } };
  return { el: out, skipped };
}

/** Each of `count` elements' start, `step` seconds apart from `start` (019/D8). */
export const staggerStarts = (count: number, start: number, step: number) =>
  Array.from({ length: count }, (_, i) => start + i * step);

/** `el` without keyframes past `duration`; `cut` lists the paths that lost any. */
function within(el: Element, duration: number): { el: Element; cut: string[] } {
  if (!el.tracks) return { el, cut: [] };
  const cut: string[] = [];
  const tracks: Tracks = {};
  for (const [path, track] of Object.entries(el.tracks)) {
    const keys = trackKeys(track);
    const kept = keys.filter((k) => k.t <= duration);
    if (kept.length < keys.length)
      cut.push(`${path} (después de ${duration}s)`);
    if (kept.length)
      tracks[path] = trackEntry(kept, trackRepeat(track), trackUntil(track));
  }
  return { el: { ...el, tracks }, cut };
}

/**
 * `preset` applied to the elements `ids` of `scene` in that order, each `step` seconds
 * after the previous from `start`, as one scene change. `skipped` names the element.
 */
export function applyToSelection(
  scene: Scene,
  ids: readonly string[],
  preset: Applied,
  start: number,
  step = 0,
): { scene: Scene; skipped: string[] } {
  const at = staggerStarts(ids.length, start, step);
  const starts = new Map(ids.map((id, i) => [id, at[i] as number]));
  const skipped: string[] = [];
  const elements = scene.elements.map((el) => {
    const t = starts.get(el.id);
    if (t === undefined) return el;
    const applied = applyPreset(el, preset, t);
    const { el: out, cut } = within(applied.el, scene.duration);
    for (const s of [...applied.skipped, ...cut])
      skipped.push(`${el.name}: ${s}`);
    return out;
  });
  return { scene: { ...scene, elements }, skipped };
}

/** Whether `el` animates on its own: an active slot or a track. */
const animates = (el: Element) =>
  Object.keys(activeSlots(el)).length > 0 ||
  Object.keys(el.tracks ?? {}).length > 0;

/** Whether any element of `elements`, group children included, names a preset. */
export const namesAnimPreset = (elements: readonly Element[]): boolean =>
  elements.some(
    (el) =>
      el.animPreset !== undefined ||
      (el.kind === "group" && namesAnimPreset(el.children)),
  );

/**
 * `scene` with every `animPreset` of an element that does not animate on its own copied in
 * from `library` (019/D10), group children included, run once on load; an unknown name
 * leaves the element as it is.
 */
export function expandAnimPresets(
  scene: Scene,
  library: readonly AnimPreset[],
): { scene: Scene; notices: string[] } {
  const byName = new Map(library.map((p) => [slugify(p.name), p]));
  const notices: string[] = [];
  const expand = (el: Element): Element => {
    if (el.kind === "group") el = { ...el, children: el.children.map(expand) };
    if (!el.animPreset || animates(el)) return el;
    const preset = byName.get(slugify(el.animPreset.name));
    if (!preset) {
      notices.push(
        `${el.name}: no existe la animación «${el.animPreset.name}»`,
      );
      return el;
    }
    const { el: out, skipped } = applyPreset(el, preset, el.animPreset.start);
    for (const s of skipped) notices.push(`${el.name}: ${s}`);
    return out;
  };
  const symbols = scene.symbols && {
    symbols: Object.fromEntries(
      Object.entries(scene.symbols).map(([name, body]) => [
        name,
        { ...body, children: body.children.map(expand) },
      ]),
    ),
  };
  return {
    scene: { ...scene, ...symbols, elements: scene.elements.map(expand) },
    notices,
  };
}
