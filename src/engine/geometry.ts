import { badgeLayout } from "../components/badge/layout.ts";
import { bodyBox } from "../components/group/frame.ts";
import type {
  Element,
  GroupEl,
  LineEl,
  Scene,
  TextEl,
} from "../model/model.ts";
import { distToPath, resolveLine, samplePath } from "./lines.ts";

export type Pt = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

let measureCtxCache: OffscreenCanvasRenderingContext2D | undefined;

/** Created on first use so the pure geometry helpers also load outside a browser. */
function measureCtx(): {
  measureText: (text: string) => { width: number };
  font: string;
  letterSpacing: string;
} {
  if (typeof OffscreenCanvas !== "undefined") {
    measureCtxCache ??= new OffscreenCanvas(1, 1).getContext(
      "2d",
    ) as OffscreenCanvasRenderingContext2D;
    return measureCtxCache;
  }
  return {
    measureText: (text: string) => ({ width: text.length * 10 }),
    font: "",
    letterSpacing: "",
  };
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
    if (el.id === skipId || el.hidden || el.locked || (only && !only(el))) continue;
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
