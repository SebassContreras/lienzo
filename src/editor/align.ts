/**
 * Alignment of several selected elements (022): line their boxes up on an edge or centre, or
 * spread them with equal gaps. Pure; the inspector's buttons call it through one undo step.
 */
import { type Box, boxOf, indexById, translate } from "../engine/geometry.ts";
import type { Scene } from "../model/model.ts";

export type AlignAction =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "centerX"
  | "centerY"
  | "distributeX"
  | "distributeY";

type Item = { id: string; box: Box };

/** Where each box goes, as an offset per id. */
function offsets(items: Item[], action: AlignAction): Map<string, Pt2> {
  const xs = items.map((i) => i.box.x);
  const ys = items.map((i) => i.box.y);
  const rs = items.map((i) => i.box.x + i.box.w);
  const bs = items.map((i) => i.box.y + i.box.h);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...rs);
  const bottom = Math.max(...bs);
  const out = new Map<string, Pt2>();
  const set = (i: Item, dx: number, dy: number) => out.set(i.id, { dx, dy });

  if (action === "distributeX" || action === "distributeY") {
    const x = action === "distributeX";
    const pos = (b: Box) => (x ? b.x : b.y);
    const len = (b: Box) => (x ? b.w : b.h);
    const sorted = [...items].sort((a, b) => pos(a.box) - pos(b.box));
    const total = sorted.reduce((s, i) => s + len(i.box), 0);
    const gap =
      ((x ? right - left : bottom - top) - total) / (items.length - 1);
    let at = x ? left : top;
    for (const i of sorted) {
      const d = at - pos(i.box);
      set(i, x ? d : 0, x ? 0 : d);
      at += len(i.box) + gap;
    }
    return out;
  }

  for (const i of items) {
    const b = i.box;
    if (action === "left") set(i, left - b.x, 0);
    if (action === "right") set(i, right - b.x - b.w, 0);
    if (action === "centerX") set(i, (left + right - b.w) / 2 - b.x, 0);
    if (action === "top") set(i, 0, top - b.y);
    if (action === "bottom") set(i, 0, bottom - b.y - b.h);
    if (action === "centerY") set(i, 0, (top + bottom - b.h) / 2 - b.y);
  }
  return out;
}

type Pt2 = { dx: number; dy: number };

/** `scene` with the elements `ids` aligned or distributed; unchanged with fewer than two. */
export function alignElements(
  scene: Scene,
  ids: string[],
  action: AlignAction,
): Scene {
  const items = scene.elements
    .filter((el) => ids.includes(el.id))
    .map((el) => ({ id: el.id, box: boxOf(el) }));
  if (items.length < 2) return scene;
  const moves = offsets(items, action);
  const byId = indexById(scene);
  const moving = new Set(ids);
  return {
    ...scene,
    elements: scene.elements.map((el) => {
      const m = moves.get(el.id);
      return m && (m.dx || m.dy) ? translate(el, m.dx, m.dy, byId, moving) : el;
    }),
  };
}
