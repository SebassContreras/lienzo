import type { ParticlesEl } from "../model/model.ts";
import { mulberry32 } from "./prng.ts";

/** Where a falling point runs: its lane across the direction, start, and crossings per loop. */
type Lane = { v: number; u0: number; k: number };

const cache = new Map<string, Lane[]>();
const MAX_CACHED = 64;

/**
 * Each point's lane, once per `(seed, count, speed)`. Crossings are whole numbers so every
 * point is back where it started after one loop (A6); they are `floor(speed)` or
 * `ceil(speed)`, drawn so the field's mean is `speed`, and never below 1.
 */
function lanesOf(el: Pick<ParticlesEl, "seed" | "count" | "speed">): Lane[] {
  const count = Math.max(0, Math.min(300, Math.floor(el.count)));
  const key = `${el.seed}|${count}|${el.speed}`;
  const hit = cache.get(key);
  if (hit) return hit;
  // its own stream, so drifting orbits and looks stay as they were
  const rand = mulberry32(Math.floor(el.seed * 6007) ^ 0x27d4eb2f);
  const base = Math.floor(el.speed);
  const extra = el.speed - base;
  const lanes: Lane[] = [];
  for (let i = 0; i < count; i++) {
    lanes.push({
      v: rand() - 0.5,
      u0: rand(),
      k: Math.max(1, base + (rand() < extra ? 1 : 0)),
    });
  }
  if (cache.size >= MAX_CACHED) cache.clear();
  cache.set(key, lanes);
  return lanes;
}

/**
 * Falling points at time `t` of a loop lasting `duration` seconds, relative to the box's
 * top-left corner (057/D5). They run along `direction` through a square of side
 * `hypot(w, h)` centred on the box, which holds it at any angle, and wrap at its far edge,
 * always outside the box. Gravity eases each crossing in: `s(τ) = (1 − a)·τ + a·τ²`, which
 * still ends at 1, so wraps stay seamless. Points further than `margin` px off the box are
 * `NaN`, for the caller to skip.
 */
export function fallPositions(
  el: Pick<
    ParticlesEl,
    "seed" | "count" | "w" | "h" | "speed" | "direction" | "gravity"
  >,
  t: number,
  duration: number,
  margin = 0,
): Float64Array {
  const lanes = lanesOf(el);
  const w = Math.abs(el.w);
  const h = Math.abs(el.h);
  const side = Math.hypot(w, h);
  const g = Math.max(0, el.gravity);
  const a = g / (1 + g);
  const rad = (el.direction * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const progress = t / (duration > 0 ? duration : 1);
  const out = new Float64Array(lanes.length * 2);
  lanes.forEach((lane, i) => {
    const run = lane.u0 + lane.k * progress;
    const tau = run - Math.floor(run);
    const along = side * ((1 - a) * tau + a * tau * tau - 0.5);
    const across = side * lane.v;
    const x = w / 2 + along * cos - across * sin;
    const y = h / 2 + along * sin + across * cos;
    const off = x < -margin || x > w + margin || y < -margin || y > h + margin;
    out[i * 2] = off ? Number.NaN : x;
    out[i * 2 + 1] = off ? Number.NaN : y;
  });
  return out;
}
