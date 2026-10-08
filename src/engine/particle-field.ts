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
