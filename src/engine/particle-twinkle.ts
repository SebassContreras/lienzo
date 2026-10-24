import type { ParticlesEl } from "../model/model.ts";
import { mulberry32 } from "./prng.ts";

/** Each point's pulse: whole pulses per loop (A6) and where in it the point starts. */
type Pulse = { f: number; p: number };

const cache = new Map<string, Pulse[]>();
const MAX_CACHED = 64;

function pulsesOf(el: Pick<ParticlesEl, "seed" | "count">): Pulse[] {
  const count = Math.max(0, Math.min(300, Math.floor(el.count)));
  const key = `${el.seed}|${count}`;
  const hit = cache.get(key);
  if (hit) return hit;
  // its own stream, so positions and looks stay as they were
  const rand = mulberry32(Math.floor(el.seed * 4421) ^ 0x165667b1);
  const pulses: Pulse[] = [];
  for (let i = 0; i < count; i++) {
    pulses.push({ f: 1 + Math.floor(rand() * 3), p: rand() * Math.PI * 2 });
  }
  if (cache.size >= MAX_CACHED) cache.clear();
  cache.set(key, pulses);
  return pulses;
}

/**
 * Each point's opacity factor at time `t` of the loop, from 1 down to `1 − twinkle`, or
 * `null` when the field does not twinkle so drawing keeps its single-path dots (057/D6).
 */
export function twinkleAlphas(
  el: Pick<ParticlesEl, "seed" | "count" | "twinkle">,
  t: number,
  duration: number,
): Float64Array | null {
  const depth = Math.max(0, Math.min(1, el.twinkle));
  if (depth === 0) return null;
  const pulses = pulsesOf(el);
  const phase = (Math.PI * 2 * t) / (duration > 0 ? duration : 1);
  const out = new Float64Array(pulses.length);
  pulses.forEach(({ f, p }, i) => {
    out[i] = 1 - depth * (0.5 - 0.5 * Math.cos(f * phase + p));
  });
  return out;
}
