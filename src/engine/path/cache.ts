/**
 * Caches for free paths (024/D2, D7): each `d` string is parsed and measured once, and each
 * pair of shapes is prepared for morphing once, keyed by a hash of the strings; a frame then
 * only interpolates arrays (R9).
 */
import {
  flatten,
  type MorphPair,
  polylineLength,
  prepareMorph,
} from "./morph-prep.ts";
import { parsePath, type Subpath } from "./parse.ts";

const MAX_CACHED = 64;

/** FNV-1a of `s`, as hex: short keys for long `d` strings. */
export function hashOf(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `${(h >>> 0).toString(16)}:${s.length}`;
}

/** `make()` remembered under `key`; the oldest entry goes once `cache` is full. */
function remembered<T>(cache: Map<string, T>, key: string, make: () => T): T {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const value = make();
  if (cache.size >= MAX_CACHED)
    cache.delete(cache.keys().next().value as string);
  cache.set(key, value);
  return value;
}

const parsed = new Map<string, Subpath[]>();
const pairs = new Map<string, MorphPair[]>();
const lengths = new Map<string, number>();

/** `parsePath(d)`, cached; errors are not cached, so they name the shape each time. */
export const subpathsOf = (d: string, name: string): Subpath[] =>
  remembered(parsed, hashOf(d), () => parsePath(d, name));

/** The prepared morph from `from` to `to`, cached by both strings' hashes. */
export const morphPairs = (
  from: string,
  to: string,
  names: [string, string],
): MorphPair[] =>
  remembered(pairs, `${hashOf(from)}>${hashOf(to)}`, () =>
    prepareMorph(subpathsOf(from, names[0]), subpathsOf(to, names[1])),
  );

/**
 * The drawn length of `d` once scaled by `sx`, `sy` (view box to element box): what the
 * draw-on reveal dashes over, measured once per shape and size.
 */
export const lengthOf = (d: string, name: string, sx: number, sy: number) =>
  remembered(lengths, `${hashOf(d)}@${sx},${sy}`, () =>
    subpathsOf(d, name).reduce((sum, sub) => {
      const pts = flatten(sub).map((v, i) => v * (i % 2 ? sy : sx));
      return sum + polylineLength(pts, sub.closed);
    }, 0),
  );
