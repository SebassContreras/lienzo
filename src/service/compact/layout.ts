/**
 * Anchors and layout resolution for compact scenes (011/D3, T004).
 * Resolves `at` placement and `fit: canvas` using element boxes and scene dimensions.
 */
import { boxOf, centerOn } from "../../engine/geometry.ts";
import type {
  AnchorName,
  AtPlacement,
  CompactOrigin,
} from "../../model/compact.ts";
import type { Element, Scene } from "../../model/model.ts";

export function resolveFitCanvas(
  el: Element,
  scene: Pick<Scene, "width" | "height">,
): void {
  const mutable = el as unknown as Record<string, unknown>;
  mutable.x = 0;
  mutable.y = 0;
  mutable.w = scene.width;
  mutable.h = scene.height;
}

/** How far edge anchors stay from the edges they touch: 5% of the shorter side (069/D11). */
export const anchorMargin = (c: { width: number; height: number }) =>
  Math.round(0.05 * Math.min(c.width, c.height));

function resolveAnchorPosition(
  anchor: AnchorName,
  box: { w: number; h: number },
  scene: Pick<Scene, "width" | "height">,
): { x: number; y: number } {
  const m = anchorMargin(scene);
  const left = m;
  const right = scene.width - box.w - m;
  const top = m;
  const bottom = scene.height - box.h - m;
  const midX = (scene.width - box.w) / 2;
  const midY = (scene.height - box.h) / 2;
  let x = midX;
  let y = midY;

  switch (anchor) {
    case "top-left":
      x = left;
      y = top;
      break;
    case "top":
      y = top;
      break;
    case "top-right":
      x = right;
      y = top;
      break;
    case "left":
      x = left;
      break;
    case "center":
      break;
    case "right":
      x = right;
      break;
    case "bottom-left":
      x = left;
      y = bottom;
      break;
    case "bottom":
      y = bottom;
      break;
    case "bottom-right":
      x = right;
      y = bottom;
      break;
  }

  return { x: Math.round(x), y: Math.round(y) };
}

/** The point any `at` form centres an element of size `box` on (064/D12). */
export function atCenter(
  at: AtPlacement,
  box: { w: number; h: number },
  container: { width: number; height: number },
): { x: number; y: number } {
  if (typeof at === "object" && "x" in at) return { x: at.x, y: at.y };
  const anchor: AnchorName = typeof at === "string" ? at : at.anchor;
  const offset = typeof at === "object" && at.offset ? at.offset : [0, 0];
  const pos = resolveAnchorPosition(anchor, box, container);
  return {
    x: pos.x + offset[0] + box.w / 2,
    y: pos.y + offset[1] + box.h / 2,
  };
}

/** `n` to two decimals, so computed positions read cleanly (068/D5). */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const roundPoint = (p: { x: number; y: number }) => ({
  x: round2(p.x),
  y: round2(p.y),
});

/** Places `el` by `at` inside `container`, the same way in every tool (064/D12). */
export function placeAt(
  el: Element,
  at: AtPlacement,
  container: { width: number; height: number },
): Element {
  const c = atCenter(at, boxOf(el), container);
  const out = centerOn(el, c.x, c.y);
  if (out.kind === "line")
    return { ...out, a: roundPoint(out.a), b: roundPoint(out.b) };
  return { ...out, ...roundPoint(out) } as Element;
}

const NAMED_ORIGINS: Record<AnchorName, { x: number; y: number }> = {
  "top-left": { x: 0, y: 0 },
  top: { x: 0.5, y: 0 },
  "top-right": { x: 1, y: 0 },
  left: { x: 0, y: 0.5 },
  center: { x: 0.5, y: 0.5 },
  right: { x: 1, y: 0.5 },
  "bottom-left": { x: 0, y: 1 },
  bottom: { x: 0.5, y: 1 },
  "bottom-right": { x: 1, y: 1 },
};

/**
 * Resolves compact origin representation ({ x, y }, [x, y], or named anchor)
 * into a canonical { x: number, y: number } in [0, 1] fractions.
 */
export function resolveOrigin(origin: CompactOrigin): { x: number; y: number } {
  if (typeof origin === "string") {
    return NAMED_ORIGINS[origin] ?? { x: 0.5, y: 0.5 };
  }
  if (Array.isArray(origin)) {
    return { x: origin[0], y: origin[1] };
  }
  return { x: origin.x, y: origin.y };
}
