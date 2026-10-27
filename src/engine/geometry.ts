import { badgeLayout } from "../components/badge/layout.ts";
import { bodyBox } from "../components/group/frame.ts";
import type {
  Element,
  GroupEl,
  LineEl,
  Scene,
  TextEl,
} from "../model/model.ts";
import { type Track, type Tracks, trackKeys } from "../model/track.ts";
import { distToPath, resolveLine, samplePath } from "./lines.ts";
import { fontStringOf, measureTextWidth } from "./text-measure.ts";

export type Pt = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

/** The text properties layout depends on; shared by text elements and rectangle labels. */
export type TextStyle = Pick<TextEl, "text" | "font" | "size" | "weight"> &
  Partial<Pick<TextEl, "italic" | "letterSpacing" | "lineHeight" | "w">>;

/** The canvas `font` for `el`, as text is measured (067/D4). */
export const fontString = (el: TextStyle): string => fontStringOf(el);

export type TextLayout = {
  lines: string[];
  widths: number[];
  w: number;
  h: number;
  lineStep: number;
};

/**
 * Wraps text into lines that fit within maxW, breaking at word boundaries.
 */
function wrapParagraph(
  text: string,
  _style: TextStyle,
  maxW: number,
  measure: (s: string) => number,
): string[] {
  if (text.length === 0) return [""];
  const words = text.split(/(\s+)/); // Keep whitespace tokens intact
  const lines: string[] = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i] as string;
    if (word === "") continue;

    const testLine = currentLine + word;
    const testWidth = measure(testLine);

    if (testWidth <= maxW) {
      currentLine = testLine;
    } else if (currentLine === "") {
      // Word alone exceeds maxW: break it by characters
      let chunk = "";
      for (const ch of word) {
        if (measure(chunk + ch) <= maxW || chunk === "") {
          chunk += ch;
        } else {
          lines.push(chunk);
          chunk = ch;
        }
      }
      currentLine = chunk;
    } else {
      // Current line has content: wrap to next line
      lines.push(currentLine.replace(/\s+$/, ""));
      if (/^\s+$/.test(word)) {
        currentLine = "";
      } else if (measure(word) > maxW) {
        let chunk = "";
        for (const ch of word) {
          if (measure(chunk + ch) <= maxW || chunk === "") {
            chunk += ch;
          } else {
            lines.push(chunk);
            chunk = ch;
          }
        }
        currentLine = chunk;
      } else {
        currentLine = word;
      }
    }
  }

  if (currentLine !== "") {
    lines.push(currentLine.replace(/\s+$/, ""));
  }

  return lines.length > 0 ? lines : [""];
}

export function textLayout(el: TextStyle): TextLayout {
  const measure = (line: string) =>
    measureTextWidth(line, {
      font: el.font,
      size: el.size,
      weight: el.weight,
      italic: el.italic,
      letterSpacing: el.letterSpacing,
    });

  const rawParagraphs = el.text.split("\n");
  const wrapW = typeof el.w === "number" && el.w > 0 ? el.w : undefined;

  const lines =
    wrapW !== undefined
      ? rawParagraphs.flatMap((p) => wrapParagraph(p, el, wrapW, measure))
      : rawParagraphs;

  const widths = lines.map((line) => measure(line));
  const lineStep = el.size * (el.lineHeight ?? 1.2);
  const layoutW = wrapW !== undefined ? wrapW : Math.max(1, ...widths);

  return {
    lines,
    widths,
    w: layoutW,
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

function inBox(b: Box, p: Pt, pad = 0): boolean {
  return (
    p.x >= b.x - pad &&
    p.x <= b.x + b.w + pad &&
    p.y >= b.y - pad &&
    p.y <= b.y + b.h + pad
  );
}

/** `track` with each numeric keyframe value passed through `f`, stored the same way. */
function mapTrack(track: Track, f: (v: number) => number): Track {
  const keys = trackKeys(track).map((k) =>
    typeof k.value === "number" ? { ...k, value: f(k.value) } : k,
  );
  return Array.isArray(track) ? keys : { ...track, keys };
}

/**
 * `el` with the tracks named in `maps` passed through their function, so keyframed motion
 * follows a change of coordinates as `x`/`y` do (071/D1).
 */
function mapTracks(
  el: Element,
  maps: Record<string, (v: number) => number>,
): Element {
  const tracks = (el as { tracks?: Tracks }).tracks;
  if (!tracks) return el;
  const out: Tracks = { ...tracks };
  for (const [path, f] of Object.entries(maps))
    if (out[path]) out[path] = mapTrack(out[path], f);
  return { ...el, tracks: out } as Element;
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
  const x = (v: number) => body.x + v * sx;
  const y = (v: number) => body.y + v * sy;
  if (child.kind === "text" || child.kind === "badge")
    return mapTracks(
      { ...child, ...at(child), size: child.size * sx },
      { x, y, size: (v) => v * sx },
    );
  return mapTracks(
    { ...child, ...at(child), w: child.w * sx, h: child.h * sy },
    { x, y, w: (v) => v * sx, h: (v) => v * sy },
  );
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
    if (el.id === skipId || el.hidden || el.locked || (only && !only(el)))
      continue;
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
  if (el.kind !== "line")
    return mapTracks(
      { ...el, x: el.x + dx, y: el.y + dy },
      { x: (v) => v + dx, y: (v) => v + dy },
    );
  const r = resolveLine(el, byId);
  const end = (ep: LineEl["a"], at: Pt) =>
    ep.attach && moving.has(ep.attach) ? ep : { x: at.x + dx, y: at.y + dy };
  return { ...el, a: end(el.a, r.a), b: end(el.b, r.b) };
}

/**
 * `pts` stretched so their own bounds span `box` exactly (059/D2); an axis with no extent stays
 * centred in the box.
 */
export function fitToBox(pts: Pt[], box: Box): Pt[] {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const axis = (
    v: number,
    lo: number,
    hi: number,
    start: number,
    size: number,
  ) => (hi > lo ? start + ((v - lo) / (hi - lo)) * size : start + size / 2);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  return pts.map((p) => ({
    x: axis(p.x, x0, x1, box.x, box.w),
    y: axis(p.y, y0, y1, box.y, box.h),
  }));
}
