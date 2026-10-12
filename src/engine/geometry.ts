import { badgeLayout } from "../components/badge/layout.ts";
import { bodyBox } from "../components/group/frame.ts";
import type {
  Anchor,
  Element,
  Endpoint,
  GroupEl,
  LineEl,
  Route,
  Scene,
  TextEl,
} from "../model/model.ts";

export type Pt = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

let measureCtxCache: OffscreenCanvasRenderingContext2D | undefined;

/** Created on first use so the pure geometry helpers also load outside a browser. */
function measureCtx(): OffscreenCanvasRenderingContext2D {
  measureCtxCache ??= new OffscreenCanvas(1, 1).getContext(
    "2d",
  ) as OffscreenCanvasRenderingContext2D;
  return measureCtxCache;
}

/** The text properties layout depends on; shared by text elements and rectangle labels. */
export type TextStyle = Pick<TextEl, "text" | "font" | "size" | "weight"> &
  Partial<Pick<TextEl, "italic" | "letterSpacing" | "lineHeight">>;

export function fontString(el: TextStyle): string {
  return `${el.italic ? "italic " : ""}${el.weight} ${el.size}px "${el.font}"`;
}

export type TextLayout = {
  lines: string[];
  widths: number[];
  w: number;
  h: number;
  lineStep: number;
};

export function textLayout(el: TextStyle): TextLayout {
  const ctx = measureCtx();
  ctx.font = fontString(el);
  ctx.letterSpacing = `${el.letterSpacing ?? 0}px`;
  const lines = el.text.split("\n");
  const widths = lines.map((line) => ctx.measureText(line).width);
  const lineStep = el.size * (el.lineHeight ?? 1.2);
  return {
    lines,
    widths,
    w: Math.max(1, ...widths),
    h: Math.max(lineStep, lines.length * lineStep),
    lineStep,
  };
}

export function boxOf(el: Element): Box {
  if (el.kind === "line") return lineBox(el);
  if (el.kind === "text") {
    const { w, h } = textLayout(el);
    return { x: el.x, y: el.y, w, h };
  }
  if (el.kind === "badge") {
    const { w, h } = badgeLayout(el);
    return { x: el.x, y: el.y, w, h };
  }
  return { x: el.x, y: el.y, w: el.w, h: el.h };
}

function lineBox(el: LineEl): Box {
  const minX = Math.min(el.a.x, el.b.x);
  const minY = Math.min(el.a.y, el.b.y);
  return {
    x: minX,
    y: minY,
    w: Math.abs(el.a.x - el.b.x),
    h: Math.abs(el.a.y - el.b.y),
  };
}

export const center = (b: Box): Pt => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

export function controlPoint(a: Pt, b: Pt, bend: number): Pt {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x: (a.x + b.x) / 2 + (-dy / len) * bend,
    y: (a.y + b.y) / 2 + (dx / len) * bend,
  };
}

/** Where a ray from the box centre towards `toward` leaves the box, pushed out by `gap`. */
function clipToBox(box: Box, toward: Pt, gap: number): Pt {
  const c = center(box);
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return c;
  const tx = dx === 0 ? Infinity : (dx > 0 ? box.w / 2 : -box.w / 2) / dx;
  const ty = dy === 0 ? Infinity : (dy > 0 ? box.h / 2 : -box.h / 2) / dy;
  const t = Math.min(tx, ty);
  return {
    x: c.x + dx * t + (dx / len) * gap,
    y: c.y + dy * t + (dy / len) * gap,
  };
}

/** Where a ray from the ellipse's centre towards `toward` leaves it, pushed out by `gap`. */
export function clipToEllipse(box: Box, toward: Pt, gap: number): Pt {
  const c = center(box);
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return c;
  const ux = dx / len;
  const uy = dy / len;
  const rx = Math.max(box.w / 2, 1e-6);
  const ry = Math.max(box.h / 2, 1e-6);
  const r = 1 / Math.hypot(ux / rx, uy / ry);
  return { x: c.x + ux * (r + gap), y: c.y + uy * (r + gap) };
}

/**
 * A line's ends after following attachments. `c` is the straight route's control point; `da`
 * and `db` are the axis directions each end leaves along, which the other routes follow.
 */
export type ResolvedLine = {
  a: Pt;
  b: Pt;
  c: Pt;
  route: Route;
  da: Pt;
  db: Pt;
};

/** The outline a line end attaches to: a box, or the ellipse inside it. */
export type Outline = { box: Box; round: boolean };

export function attachedOutline(
  ep: Endpoint,
  byId: Map<string, Element>,
): Outline | undefined {
  if (!ep.attach) return undefined;
  const target = byId.get(ep.attach);
  if (!target || target.kind === "line") return undefined;
  return { box: boxOf(target), round: target.kind === "ellipse" };
}

function clipTo(outline: Outline, toward: Pt, gap: number): Pt {
  return outline.round
    ? clipToEllipse(outline.box, toward, gap)
    : clipToBox(outline.box, toward, gap);
}

type Side = Exclude<Anchor, "auto" | "center">;

const SIDES: Record<Side, Pt> = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const isSide = (anchor: Anchor): anchor is Side => anchor in SIDES;

/**
 * The point of `outline` at `anchor`, pushed out by `gap`. `auto` is where a ray from the
 * centre towards `toward` leaves the outline; the other anchors ignore `toward`.
 */
export function anchorPoint(
  outline: Outline,
  anchor: Anchor,
  toward: Pt,
  gap = 0,
): Pt {
  if (anchor === "auto") return clipTo(outline, toward, gap);
  const { box } = outline;
  const c = center(box);
  if (anchor === "center") return c;
  const d = SIDES[anchor];
  return {
    x: c.x + d.x * (box.w / 2 + gap),
    y: c.y + d.y * (box.h / 2 + gap),
  };
}

/** The anchors with a fixed place on the outline, offered as handles while an end is dragged. */
export const FIXED_ANCHORS = [
  "top",
  "bottom",
  "left",
  "right",
  "center",
] as const satisfies readonly Anchor[];

/** The fixed anchor of `outline` within `tol` of `p`, else `auto` (021/D4). */
export function nearestAnchor(outline: Outline, p: Pt, tol: number): Anchor {
  let best: Anchor = "auto";
  let bestD = tol;
  for (const anchor of FIXED_ANCHORS) {
    const q = anchorPoint(outline, anchor, p);
    const d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d <= bestD) {
      best = anchor;
      bestD = d;
    }
  }
  return best;
}

/** The axis direction closest to `d` (horizontal on a tie). */
function snapAxis(d: Pt): Pt {
  if (Math.abs(d.x) >= Math.abs(d.y)) return { x: d.x < 0 ? -1 : 1, y: 0 };
  return { x: 0, y: d.y < 0 ? -1 : 1 };
}

/** The axis an end at `p` leaves along: its anchor's side, else away from its target or towards `other`. */
function exitDir(
  p: Pt,
  anchor: Anchor,
  outline: Outline | undefined,
  other: Pt,
): Pt {
  if (outline && isSide(anchor)) return SIDES[anchor];
  const c = outline ? center(outline.box) : p;
  const away = { x: p.x - c.x, y: p.y - c.y };
  return snapAxis(
    Math.hypot(away.x, away.y) > 1e-6
      ? away
      : { x: other.x - p.x, y: other.y - p.y },
  );
}

/** Endpoints after following attachments: attached ends sit on the target's outline at their anchor. */
export function resolveLine(
  line: LineEl,
  byId: Map<string, Element>,
): ResolvedLine {
  const outA = attachedOutline(line.a, byId);
  const outB = attachedOutline(line.b, byId);
  const anchorA = line.a.anchor ?? "auto";
  const anchorB = line.b.anchor ?? "auto";
  const { route } = line;
  const bend = route === "straight" ? line.bend : 0;
  const gap = 8 + line.width;
  // a fixed anchor is where the end is; an auto one aims from the target's centre
  const raw = (out: Outline | undefined, anchor: Anchor, free: Pt) => {
    if (!out) return free;
    const c = center(out.box);
    return anchor === "auto" ? c : anchorPoint(out, anchor, c, gap);
  };
  const rawA = raw(outA, anchorA, line.a);
  const rawB = raw(outB, anchorB, line.b);
  const rawC = controlPoint(rawA, rawB, bend);
  const a = outA ? anchorPoint(outA, anchorA, rawC, gap) : rawA;
  const b = outB ? anchorPoint(outB, anchorB, rawC, gap) : rawB;
  return {
    a,
    b,
    c: controlPoint(a, b, bend),
    route,
    da: exitDir(a, anchorA, outA, b),
    db: exitDir(b, anchorB, outB, a),
  };
}

/** The corners of the elbow route: it leaves each end along that end's axis. */
export function elbowPoints(r: ResolvedLine): Pt[] {
  const { a, b } = r;
  const flatA = r.da.y === 0;
  const flatB = r.db.y === 0;
  let pts: Pt[];
  if (flatA && flatB) {
    const mx = (a.x + b.x) / 2;
    pts = [a, { x: mx, y: a.y }, { x: mx, y: b.y }, b];
  } else if (!flatA && !flatB) {
    const my = (a.y + b.y) / 2;
    pts = [a, { x: a.x, y: my }, { x: b.x, y: my }, b];
  } else {
    pts = [a, flatA ? { x: b.x, y: a.y } : { x: a.x, y: b.y }, b];
  }
  // zero-length legs would give the arrows no direction
  return pts.filter((p, i) => {
    const prev = pts[i - 1];
    return !prev || Math.hypot(p.x - prev.x, p.y - prev.y) > 1e-6;
  });
}

/** Point `t` (0–1) of the curved route: a cubic leaving each end along its axis. */
export function cubicAt(r: ResolvedLine, t: number): Pt {
  const k = Math.max(30, Math.hypot(r.b.x - r.a.x, r.b.y - r.a.y) * 0.4);
  const c1 = { x: r.a.x + r.da.x * k, y: r.a.y + r.da.y * k };
  const c2 = { x: r.b.x + r.db.x * k, y: r.b.y + r.db.y * k };
  const u = 1 - t;
  const w0 = u * u * u;
  const w1 = 3 * u * u * t;
  const w2 = 3 * u * t * t;
  const w3 = t * t * t;
  return {
    x: w0 * r.a.x + w1 * c1.x + w2 * c2.x + w3 * r.b.x,
    y: w0 * r.a.y + w1 * c1.y + w2 * c2.y + w3 * r.b.y,
  };
}

/** The points a route is drawn through, `n` steps for the smooth ones. */
function routePoints(r: ResolvedLine, n: number): Pt[] {
  if (r.route === "orthogonal") return elbowPoints(r);
  const at = r.route === "curved" ? cubicAt : quadAt;
  return Array.from({ length: n + 1 }, (_, i) => at(r, i / n));
}

export function quadAt(r: ResolvedLine, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * r.a.x + 2 * u * t * r.c.x + t * t * r.b.x,
    y: u * u * r.a.y + 2 * u * t * r.c.y + t * t * r.b.y,
  };
}

export type PathSamples = { pts: Pt[]; lens: number[]; total: number };

export function samplePath(r: ResolvedLine, n = 80): PathSamples {
  const pts = routePoints(r, n);
  const lens: number[] = [];
  let total = 0;
  pts.forEach((p, i) => {
    if (i > 0) {
      const prev = pts[i - 1] as Pt;
      total += Math.hypot(p.x - prev.x, p.y - prev.y);
    }
    lens.push(total);
  });
  return { pts, lens, total };
}

/** Point and direction at a fraction `u` (0–1) of the path's length. */
export function pointAtFraction(
  s: PathSamples,
  u: number,
): { p: Pt; angle: number } {
  const target = Math.min(Math.max(u, 0), 1) * s.total;
  let i = 1;
  while (i < s.lens.length - 1 && (s.lens[i] as number) < target) i++;
  const p0 = s.pts[i - 1] as Pt;
  const p1 = s.pts[i] as Pt;
  const l0 = s.lens[i - 1] as number;
  const l1 = s.lens[i] as number;
  const k = l1 - l0 > 0 ? (target - l0) / (l1 - l0) : 0;
  return {
    p: { x: p0.x + (p1.x - p0.x) * k, y: p0.y + (p1.y - p0.y) * k },
    angle: Math.atan2(p1.y - p0.y, p1.x - p0.x),
  };
}

/** The sampled path cut at fraction `u` of its length. */
export function partialPath(s: PathSamples, u: number): Pt[] {
  if (u >= 1) return s.pts;
  const target = Math.max(u, 0) * s.total;
  const out: Pt[] = [];
  for (let i = 0; i < s.pts.length; i++) {
    if ((s.lens[i] as number) <= target) out.push(s.pts[i] as Pt);
    else break;
  }
  out.push(pointAtFraction(s, u).p);
  return out;
}

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  const t =
    l2 === 0
      ? 0
      : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function distToPath(s: PathSamples, p: Pt): number {
  let best = Infinity;
  for (let i = 1; i < s.pts.length; i++) {
    best = Math.min(best, distToSegment(p, s.pts[i - 1] as Pt, s.pts[i] as Pt));
  }
  return best;
}

export function inBox(b: Box, p: Pt, pad = 0): boolean {
  return (
    p.x >= b.x - pad &&
    p.x <= b.x + b.w + pad &&
    p.y >= b.y - pad &&
    p.y <= b.y + b.h + pad
  );
}

/**
 * A group's child as it appears on the canvas: its position and size mapped from the group's
 * content space onto the group's body: its box, less a window frame (a text's size scales
 * with the width).
 */
export function placeChild(child: Element, group: GroupEl): Element {
  const body = bodyBox(group);
  const sx = body.w / (group.cw || 1);
  const sy = body.h / (group.ch || 1);
  const at = (p: Pt) => ({ x: body.x + p.x * sx, y: body.y + p.y * sy });
  if (child.kind === "line") {
    return {
      ...child,
      a: { ...child.a, ...at(child.a) },
      b: { ...child.b, ...at(child.b) },
    };
  }
  if (child.kind === "text" || child.kind === "badge")
    return { ...child, ...at(child), size: child.size * sx };
  return { ...child, ...at(child), w: child.w * sx, h: child.h * sy };
}

/** Every element by id, including those inside groups, in canvas coordinates. */
export function indexElements(elements: Element[]): Map<string, Element> {
  const byId = new Map<string, Element>();
  const add = (el: Element) => {
    byId.set(el.id, el);
    if (el.kind === "group") {
      for (const child of el.children) add(placeChild(child, el));
    }
  };
  elements.forEach(add);
  return byId;
}

export function indexById(scene: Scene): Map<string, Element> {
  return indexElements(scene.elements);
}

/** Topmost element under `p`; `tol` is the click tolerance in scene px. */
export function hitTest(
  scene: Scene,
  p: Pt,
  tol: number,
  skipId?: string,
  only?: (el: Element) => boolean,
): Element | undefined {
  const byId = indexById(scene);
  for (let i = scene.elements.length - 1; i >= 0; i--) {
    const el = scene.elements[i] as Element;
    if (el.id === skipId || (only && !only(el))) continue;
    if (el.kind === "line") {
      const s = samplePath(resolveLine(el, byId), 40);
      if (distToPath(s, p) <= Math.max(tol, el.width / 2 + tol / 2)) return el;
    } else if (inBox(boxOf(el), p)) {
      return el;
    }
  }
  return undefined;
}

/** Moves a template element so its visual centre lands on (cx, cy). */
export function centerOn(el: Element, cx: number, cy: number): Element {
  if (el.kind === "line") {
    const mx = (el.a.x + el.b.x) / 2;
    const my = (el.a.y + el.b.y) / 2;
    return {
      ...el,
      a: { x: el.a.x - mx + cx, y: el.a.y - my + cy },
      b: { x: el.b.x - mx + cx, y: el.b.y - my + cy },
    };
  }
  const b = boxOf(el);
  return { ...el, x: cx - b.w / 2, y: cy - b.h / 2 };
}

/** Whether two boxes overlap. */
export function boxesTouch(a: Box, b: Box): boolean {
  return (
    a.x <= b.x + b.w && b.x <= a.x + a.w && a.y <= b.y + b.h && b.y <= a.y + a.h
  );
}

/**
 * Moves an element by (dx, dy). A line end attached to an element in `moving` stays attached
 * (its target moves too); any other end is placed where it is drawn, shifted, and detached.
 */
export function translate(
  el: Element,
  dx: number,
  dy: number,
  byId: Map<string, Element>,
  moving: Set<string> = new Set(),
): Element {
  if (el.kind !== "line") return { ...el, x: el.x + dx, y: el.y + dy };
  const r = resolveLine(el, byId);
  const end = (ep: LineEl["a"], at: Pt) =>
    ep.attach && moving.has(ep.attach) ? ep : { x: at.x + dx, y: at.y + dy };
  return { ...el, a: end(el.a, r.a), b: end(el.b, r.b) };
}
