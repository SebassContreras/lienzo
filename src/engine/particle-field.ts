import type { ParticlesEl } from "../model/model.ts";

/** Where a point rests and how it orbits around that place once per loop. */
type Orbit = {
  bx: number;
  by: number;
  ax: number;
  ay: number;
  fx: number;
  fy: number;
  px: number;
  py: number;
};

/** mulberry32: a small seeded PRNG giving numbers in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map<string, Orbit[]>();
const MAX_CACHED = 64;

/**
 * Each point's orbit, computed once per `(seed, count, w, h, drift, speed)`: a resting place
 * inside the box shrunk by `drift`, amplitudes up to `drift`, phases, and whole-number
 * frequencies from 1 to `speed` so every path closes exactly once per loop (A6).
 */
export function orbitsOf(
  el: Pick<ParticlesEl, "seed" | "count" | "w" | "h" | "drift" | "speed">,
): Orbit[] {
  const count = Math.max(0, Math.min(300, Math.floor(el.count)));
  const speed = Math.max(1, Math.floor(el.speed));
  const key = `${el.seed}|${count}|${el.w}|${el.h}|${el.drift}|${speed}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rand = mulberry32(Math.floor(el.seed * 9973) ^ 0x9e3779b9);
  const w = Math.abs(el.w);
  const h = Math.abs(el.h);
  // the drift cannot exceed half the box, or points would leave it
  const dx = Math.max(0, Math.min(el.drift, w / 2));
  const dy = Math.max(0, Math.min(el.drift, h / 2));
  const tau = Math.PI * 2;
  const orbits: Orbit[] = [];
  for (let i = 0; i < count; i++) {
    orbits.push({
      bx: dx + rand() * (w - 2 * dx),
      by: dy + rand() * (h - 2 * dy),
      ax: rand() * dx,
      ay: rand() * dy,
      fx: 1 + Math.floor(rand() * speed),
      fy: 1 + Math.floor(rand() * speed),
      px: rand() * tau,
      py: rand() * tau,
    });
  }
  if (cache.size >= MAX_CACHED) cache.clear();
  cache.set(key, orbits);
  return orbits;
}

/**
 * Point positions at time `t` of a loop lasting `duration` seconds, relative to the box's
 * top-left corner. Nothing random runs here: the same inputs always give the same points.
 */
export function particlePositions(
  el: Pick<ParticlesEl, "seed" | "count" | "w" | "h" | "drift" | "speed">,
  t: number,
  duration: number,
): Float64Array {
  const orbits = orbitsOf(el);
  const out = new Float64Array(orbits.length * 2);
  const phase = (Math.PI * 2 * t) / (duration > 0 ? duration : 1);
  orbits.forEach((o, i) => {
    out[i * 2] = o.bx + o.ax * Math.cos(o.fx * phase + o.px);
    out[i * 2 + 1] = o.by + o.ay * Math.sin(o.fy * phase + o.py);
  });
  return out;
}

/** Opacity of the line between two points `d` apart: full when touching, 0 at `distance`. */
export function linkAlpha(
  d: number,
  distance: number,
  opacity: number,
): number {
  if (distance <= 0 || d >= distance) return 0;
  return opacity * (1 - d / distance);
}

/** Each point's own look, from the seed: scale, starting angle, turns per loop, opacity, hue. */
export type Looks = {
  scale: Float64Array;
  angle: Float64Array;
  spin: Int32Array;
  alpha: Float64Array;
  /** Index into `HUE_STEPS`. */
  hue: Uint8Array;
};

/** How many hue variants a field has at most: each is one sprite (014/D5). */
export const HUE_STEPS = 6;

/** The hue turn, degrees, of variant `k` when hues vary up to `shift` either way. */
export const hueOf = (k: number, shift: number): number =>
  Math.round(-shift + (2 * shift * k) / (HUE_STEPS - 1));

const looksCache = new Map<string, Looks>();

/**
 * Every point's look, computed once per seed, count and variation. Drawn from its own
 * generator so the orbits stay where they were before 014.
 */
export function looksOf(
  el: Pick<ParticlesEl, "seed" | "count" | "variation">,
): Looks {
  const n = Math.max(0, Math.min(300, Math.floor(el.count)));
  const v = el.variation;
  const key = `${el.seed}|${n}|${JSON.stringify(v)}`;
  const hit = looksCache.get(key);
  if (hit) return hit;
  const rand = mulberry32(Math.floor(el.seed * 7919) ^ 0x85ebca6b);
  const between = (a: number, b: number) => a + rand() * (b - a);
  const looks: Looks = {
    scale: new Float64Array(n),
    angle: new Float64Array(n),
    spin: new Int32Array(n),
    alpha: new Float64Array(n),
    hue: new Uint8Array(n),
  };
  const turns = Math.max(0, Math.floor(v.spin));
  for (let i = 0; i < n; i++) {
    looks.scale[i] = between(v.sizeMin, v.sizeMax);
    looks.angle[i] = (between(-v.rotation, v.rotation) * Math.PI) / 180;
    looks.spin[i] = Math.floor(rand() * (2 * turns + 1)) - turns;
    looks.alpha[i] = between(v.opacityMin, v.opacityMax);
    looks.hue[i] = v.hueShift > 0 ? Math.floor(rand() * HUE_STEPS) : 0;
  }
  if (looksCache.size >= MAX_CACHED) looksCache.clear();
  looksCache.set(key, looks);
  return looks;
}

/** True when every point looks the same, the way particles drew before 014. */
export function uniformLooks(v: ParticlesEl["variation"]): boolean {
  return (
    v.sizeMin === 1 &&
    v.sizeMax === 1 &&
    v.rotation === 0 &&
    v.spin === 0 &&
    v.opacityMin === 1 &&
    v.opacityMax === 1 &&
    v.hueShift === 0
  );
}
