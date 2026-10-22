/**
 * Morph preparation (024/D5), pure: two shapes' subpaths become pairs of point rings with
 * the same number of points, the same winding and aligned starts, so an in-between frame is
 * a plain interpolation of two arrays. Done once per pair of shapes and cached (D7).
 */
import type { Cubic, Subpath } from "./parse.ts";

/** Points per subpath after resampling; enough for smooth curves at post sizes. */
export const RING_POINTS = 96;

/** Segments each cubic is flattened into before resampling. */
const FLATTEN_STEPS = 16;

/** Interleaved `[x0, y0, x1, y1, …]` points. */
export type Points = number[];

/** One subpath of each shape, ready to interpolate; `closed` when both ends close. */
export type MorphPair = { a: Points; b: Points; closed: boolean };

type Ring = {
  pts: Points;
  closed: boolean;
  area: number;
  cx: number;
  cy: number;
};

function cubicAt(c: Cubic, s: number): [number, number] {
  const u = 1 - s;
  const k0 = u * u * u;
  const k1 = 3 * u * u * s;
  const k2 = 3 * u * s * s;
  const k3 = s * s * s;
  return [
    k0 * c[0] + k1 * c[2] + k2 * c[4] + k3 * c[6],
    k0 * c[1] + k1 * c[3] + k2 * c[5] + k3 * c[7],
  ];
}

/** The subpath as a polyline, its first point included once. */
export function flatten(sub: Subpath): Points {
  const first = sub.curves[0] as Cubic;
  const out: Points = [first[0], first[1]];
  for (const c of sub.curves) {
    for (let i = 1; i <= FLATTEN_STEPS; i++)
      out.push(...cubicAt(c, i / FLATTEN_STEPS));
  }
  return out;
}

/** Length of a polyline, with the closing segment when `closed`. */
export function polylineLength(pts: Points, closed: boolean): number {
  let len = 0;
  const n = pts.length / 2;
  for (let i = 1; i < n; i++)
    len += Math.hypot(
      (pts[2 * i] as number) - (pts[2 * i - 2] as number),
      (pts[2 * i + 1] as number) - (pts[2 * i - 1] as number),
    );
  if (closed && n > 1)
    len += Math.hypot(
      (pts[0] as number) - (pts[2 * n - 2] as number),
      (pts[1] as number) - (pts[2 * n - 1] as number),
    );
  return len;
}

/**
 * `count` points evenly spaced by arc length along `pts`. A closed ring's last point is not
 * its first again; an open one keeps both ends.
 */
function resample(pts: Points, count: number, closed: boolean): Points {
  const n = pts.length / 2;
  const loop = closed ? [...pts, pts[0] as number, pts[1] as number] : pts;
  const total = polylineLength(pts, closed);
  const out: Points = [];
  if (total === 0 || n < 2) {
    for (let i = 0; i < count; i++)
      out.push(pts[0] as number, pts[1] as number);
    return out;
  }
  const step = total / (closed ? count : count - 1);
  let seg = 0;
  let segStart = 0;
  const segLen = (j: number) =>
    Math.hypot(
      (loop[2 * j + 2] as number) - (loop[2 * j] as number),
      (loop[2 * j + 3] as number) - (loop[2 * j + 1] as number),
    );
  const last = loop.length / 2 - 2;
  for (let i = 0; i < count; i++) {
    const at = Math.min(i * step, total);
    while (seg < last && segStart + segLen(seg) < at) {
      segStart += segLen(seg);
      seg++;
    }
    const l = segLen(seg);
    const k = l > 0 ? Math.min(1, (at - segStart) / l) : 0;
    const x0 = loop[2 * seg] as number;
    const y0 = loop[2 * seg + 1] as number;
    out.push(
      x0 + ((loop[2 * seg + 2] as number) - x0) * k,
      y0 + ((loop[2 * seg + 3] as number) - y0) * k,
    );
  }
  return out;
}

/** Shoelace area: positive for one winding direction, negative for the other. */
export function signedArea(pts: Points): number {
  let a = 0;
  const n = pts.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a +=
      (pts[2 * i] as number) * (pts[2 * j + 1] as number) -
      (pts[2 * j] as number) * (pts[2 * i + 1] as number);
  }
  return a / 2;
}

function ringOf(sub: Subpath): Ring {
  const pts = resample(flatten(sub), RING_POINTS, sub.closed);
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < RING_POINTS; i++) {
    cx += pts[2 * i] as number;
    cy += pts[2 * i + 1] as number;
  }
  return {
    pts,
    closed: sub.closed,
    area: signedArea(pts),
    cx: cx / RING_POINTS,
    cy: cy / RING_POINTS,
  };
}

/** The same points in the opposite order, starting at the same point. */
function reversed(pts: Points): Points {
  const n = pts.length / 2;
  const out: Points = [];
  for (let i = 0; i < n; i++) {
    const j = (n - i) % n;
    out.push(pts[2 * j] as number, pts[2 * j + 1] as number);
  }
  return out;
}

/** The ring shrunk to a point at its centroid: what an unpaired subpath grows from. */
const collapsed = (r: Ring): Points =>
  Array.from({ length: RING_POINTS }, () => [r.cx, r.cy]).flat();

/** Summed squared distance from `a` to `b` read from point `shift` on. */
function travel(a: Points, b: Points, shift: number): number {
  const n = a.length / 2;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + shift) % n;
    sum +=
      ((a[2 * i] as number) - (b[2 * j] as number)) ** 2 +
      ((a[2 * i + 1] as number) - (b[2 * j + 1] as number)) ** 2;
  }
  return sum;
}

/** `b` started at the point that minimises the travel to `a` (closed rings only). */
function aligned(a: Points, b: Points): Points {
  const n = b.length / 2;
  let best = 0;
  let bestCost = Infinity;
  for (let s = 0; s < n; s++) {
    const cost = travel(a, b, s);
    if (cost < bestCost) {
      bestCost = cost;
      best = s;
    }
  }
  return [...b.slice(2 * best), ...b.slice(0, 2 * best)];
}

/** How unlike two subpaths are: where they sit and how big they are. */
const pairCost = (a: Ring, b: Ring) =>
  Math.hypot(a.cx - b.cx, a.cy - b.cy) +
  Math.abs(Math.sqrt(Math.abs(a.area)) - Math.sqrt(Math.abs(b.area)));

/**
 * `b` turned to follow `a` without twisting: the same winding (holes stay holes) and, for
 * closed rings, the start that travels least; an open `b` is read backwards when its ends
 * lie the other way round (024/R6).
 */
function matched(a: Ring, b: Ring): MorphPair {
  const closed = a.closed && b.closed;
  if (closed) {
    const pts =
      Math.sign(a.area) === Math.sign(b.area) ? b.pts : reversed(b.pts);
    return { a: a.pts, b: aligned(a.pts, pts), closed };
  }
  const flipped = [...b.pts];
  const n = RING_POINTS;
  for (let i = 0; i < n; i++) {
    flipped[2 * i] = b.pts[2 * (n - 1 - i)] as number;
    flipped[2 * i + 1] = b.pts[2 * (n - 1 - i) + 1] as number;
  }
  return {
    a: a.pts,
    b: travel(a.pts, flipped, 0) < travel(a.pts, b.pts, 0) ? flipped : b.pts,
    closed,
  };
}

/**
 * The pairs that morph `from` into `to` (024/D5): subpaths paired largest first with the
 * closest unused one of the other shape by place and size; a subpath left without a partner
 * grows from, or shrinks to, its own centroid (R5).
 */
export function prepareMorph(from: Subpath[], to: Subpath[]): MorphPair[] {
  const as = from
    .map(ringOf)
    .sort((p, q) => Math.abs(q.area) - Math.abs(p.area));
  const bs = to.map(ringOf);
  const free = new Set(bs.keys());
  const pairs: MorphPair[] = [];
  for (const a of as) {
    let best = -1;
    for (const j of free) {
      if (
        best < 0 ||
        pairCost(a, bs[j] as Ring) < pairCost(a, bs[best] as Ring)
      )
        best = j;
    }
    if (best < 0) {
      pairs.push({ a: a.pts, b: collapsed(a), closed: a.closed });
      continue;
    }
    free.delete(best);
    pairs.push(matched(a, bs[best] as Ring));
  }
  for (const j of free) {
    const b = bs[j] as Ring;
    pairs.push({ a: collapsed(b), b: b.pts, closed: b.closed });
  }
  return pairs;
}
