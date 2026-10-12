/**
 * Smart guides for dragging (022): where a moving box snaps to the edges and centres of the
 * other boxes and of the canvas, and where it sits at an equal gap between two neighbours.
 * Pure, so it is tested without a browser; the stage only draws what it returns.
 */
import type { Box } from "../engine/geometry.ts";

/** How close, in screen pixels, an edge or centre has to be to snap (R2). */
export const SNAP_PX = 5;

/** A dashed line at `at` on `axis` ("x" is a vertical line), running from `from` to `to`. */
export type Guide = { axis: "x" | "y"; at: number; from: number; to: number };

/** One of two equal gaps: a span on `axis` drawn across at `at` (R3). */
export type GapMark = { axis: "x" | "y"; from: number; to: number; at: number };

export type Snap = { dx: number; dy: number; guides: Guide[]; gaps: GapMark[] };

const NONE: Snap = { dx: 0, dy: 0, guides: [], gaps: [] };

/** Matches within this many scene units count as aligned once snapped. */
const EPS = 0.5;

type Span = { lo: number; hi: number };

/** A box seen along one axis: its span there, and its span on the other axis. */
const along = (b: Box, axis: "x" | "y"): { main: Span; cross: Span } =>
  axis === "x"
    ? { main: { lo: b.x, hi: b.x + b.w }, cross: { lo: b.y, hi: b.y + b.h } }
    : { main: { lo: b.y, hi: b.y + b.h }, cross: { lo: b.x, hi: b.x + b.w } };

const stops = (s: Span) => [s.lo, (s.lo + s.hi) / 2, s.hi];

const shift = (s: Span, d: number): Span => ({ lo: s.lo + d, hi: s.hi + d });

const overlaps = (a: Span, b: Span) => a.lo < b.hi && b.lo < a.hi;

/** The gaps between the moving span and a neighbour on each side, overlapping on the cross axis. */
function gapPairs(main: Span, cross: Span, others: Box[], axis: "x" | "y") {
  const near = others
    .map((b) => along(b, axis))
    .filter((o) => overlaps(o.cross, cross));
  const before = near.filter((o) => o.main.hi <= main.lo);
  const after = near.filter((o) => o.main.lo >= main.hi);
  return before.flatMap((a) => after.map((b) => ({ a, b })));
}

/** The snapped offset and the guides and gap marks on one axis. */
function snapAxis(
  moving: Box,
  others: Box[],
  size: number,
  axis: "x" | "y",
  tol: number,
): { d: number; guides: Guide[]; gaps: GapMark[] } {
  const { main, cross } = along(moving, axis);
  const targets = others.map((b) => along(b, axis));
  const lines = [...targets.flatMap((t) => stops(t.main)), 0, size / 2, size];

  // every offset that would line something up, nearest first
  const offsets = [
    ...lines.flatMap((at) => stops(main).map((m) => at - m)),
    ...gapPairs(main, cross, others, axis).map(
      ({ a, b }) => (b.main.lo - main.hi - (main.lo - a.main.hi)) / 2,
    ),
  ].filter((d) => Math.abs(d) <= tol);
  if (offsets.length === 0) return { d: 0, guides: [], gaps: [] };
  const d = offsets.reduce((m, o) => (Math.abs(o) < Math.abs(m) ? o : m));

  const placed = shift(main, d);
  const guides: Guide[] = [];
  for (const t of targets) {
    for (const at of stops(t.main)) {
      if (!stops(placed).some((m) => Math.abs(m - at) < EPS)) continue;
      guides.push({
        axis,
        at,
        from: Math.min(t.cross.lo, cross.lo),
        to: Math.max(t.cross.hi, cross.hi),
      });
    }
  }
  for (const at of [0, size / 2, size]) {
    if (stops(placed).some((m) => Math.abs(m - at) < EPS))
      guides.push({ axis, at, from: -Infinity, to: Infinity });
  }

  const gaps = gapPairs(placed, cross, others, axis)
    .filter(
      ({ a, b }) =>
        Math.abs(placed.lo - a.main.hi - (b.main.lo - placed.hi)) < EPS,
    )
    .flatMap(({ a, b }) => [
      {
        axis,
        from: a.main.hi,
        to: placed.lo,
        at:
          (Math.max(a.cross.lo, cross.lo) + Math.min(a.cross.hi, cross.hi)) / 2,
      },
      {
        axis,
        from: placed.hi,
        to: b.main.lo,
        at:
          (Math.max(b.cross.lo, cross.lo) + Math.min(b.cross.hi, cross.hi)) / 2,
      },
    ]);
  return { d, guides, gaps };
}

/**
 * Snaps `moving` (already at the pointer's position) to `others` and the canvas. The
 * threshold is `SNAP_PX` screen pixels at `zoom`; with `enabled` false nothing snaps.
 * Canvas guides span `-Infinity..Infinity`: the stage clips them to the canvas.
 */
export function snapBox(
  moving: Box,
  others: Box[],
  canvas: { width: number; height: number },
  zoom: number,
  enabled = true,
): Snap {
  if (!enabled) return NONE;
  const tol = SNAP_PX / zoom;
  const x = snapAxis(moving, others, canvas.width, "x", tol);
  const y = snapAxis(moving, others, canvas.height, "y", tol);
  return {
    dx: x.d,
    dy: y.d,
    guides: [...x.guides, ...y.guides],
    gaps: [...x.gaps, ...y.gaps],
  };
}

/** The smallest box around `boxes`; undefined when there are none (D4). */
export function unionBox(boxes: Box[]): Box | undefined {
  if (boxes.length === 0) return undefined;
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  const r = Math.max(...boxes.map((b) => b.x + b.w));
  const bt = Math.max(...boxes.map((b) => b.y + b.h));
  return { x, y, w: r - x, h: bt - y };
}
