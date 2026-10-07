import type {
  Element,
  Endpoint,
  GroupEl,
  LineEl,
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

const center = (b: Box): Pt => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

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

export type ResolvedLine = { a: Pt; b: Pt; c: Pt };

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

/** Endpoints after following attachments: attached ends sit on the target's edge. */
export function resolveLine(
  line: LineEl,
  byId: Map<string, Element>,
): ResolvedLine {
  const outA = attachedOutline(line.a, byId);
  const outB = attachedOutline(line.b, byId);
  const rawA = outA ? center(outA.box) : line.a;
  const rawB = outB ? center(outB.box) : line.b;
  const rawC = controlPoint(rawA, rawB, line.bend);
  const gap = 8 + line.width;
  const a = outA ? clipTo(outA, rawC, gap) : rawA;
  const b = outB ? clipTo(outB, rawC, gap) : rawB;
  return { a, b, c: controlPoint(a, b, line.bend) };
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
  const pts: Pt[] = [];
  const lens: number[] = [];
  let total = 0;
  for (let i = 0; i <= n; i++) {
    const p = quadAt(r, i / n);
    if (i > 0) {
      const prev = pts[i - 1] as Pt;
      total += Math.hypot(p.x - prev.x, p.y - prev.y);
    }
    pts.push(p);
    lens.push(total);
  }
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
 * content space onto the group's box (a text's size scales with the width).
 */
export function placeChild(child: Element, group: GroupEl): Element {
  const sx = group.w / (group.cw || 1);
  const sy = group.h / (group.ch || 1);
  const at = (p: Pt) => ({ x: group.x + p.x * sx, y: group.y + p.y * sy });
  if (child.kind === "line") {
    return {
      ...child,
      a: { ...child.a, ...at(child.a) },
      b: { ...child.b, ...at(child.b) },
    };
  }
  if (child.kind === "text")
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
