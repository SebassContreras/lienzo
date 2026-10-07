import {
  defaultGroup,
  type Element,
  type GroupEl,
  type Scene,
} from "../model/model.ts";
import {
  type Box,
  boxOf,
  indexById,
  placeChild,
  resolveLine,
  translate,
} from "./geometry.ts";

/** The ids of `el` and of everything inside it. */
export function idsWithin(el: Element): string[] {
  return el.kind === "group"
    ? [el.id, ...el.children.flatMap(idsWithin)]
    : [el.id];
}

/** The smallest box around the elements, lines measured where they are drawn. */
export function boundsOf(elements: Element[], byId: Map<string, Element>): Box {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const el of elements) {
    const pts =
      el.kind === "line"
        ? (() => {
            const r = resolveLine(el, byId);
            return [r.a, r.b];
          })()
        : (() => {
            const b = boxOf(el);
            return [
              { x: b.x, y: b.y },
              { x: b.x + b.w, y: b.y + b.h },
            ];
          })();
    for (const p of pts) {
      x0 = Math.min(x0, p.x);
      y0 = Math.min(y0, p.y);
      x1 = Math.max(x1, p.x);
      y1 = Math.max(y1, p.y);
    }
  }
  return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
}

/**
 * Puts the elements `ids` into one group, placed where the topmost of them was in the layer
 * order. Lines inside the group stay attached to elements that are also inside; lines outside
 * keep following the elements they were attached to.
 */
export function groupElements(
  scene: Scene,
  ids: string[],
): { scene: Scene; group?: GroupEl } {
  const members = scene.elements.filter((el) => ids.includes(el.id));
  if (members.length < 2) return { scene };
  const byId = indexById(scene);
  const box = boundsOf(members, byId);
  const inside = new Set(members.map((el) => el.id));
  const group: GroupEl = {
    ...defaultGroup(),
    name: "Grupo",
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    cw: box.w,
    ch: box.h,
    children: members.map((el) => translate(el, -box.x, -box.y, byId, inside)),
  };
  const top = Math.max(...members.map((el) => scene.elements.indexOf(el)));
  const elements: Element[] = [];
  scene.elements.forEach((el, i) => {
    if (i === top) elements.push(group);
    else if (!inside.has(el.id)) elements.push(el);
  });
  return { scene: { ...scene, elements }, group };
}

/**
 * Replaces a group by its children, placed where they are drawn (sizes scaled by the group's
 * stretch). The group's own animation is dropped.
 */
export function ungroupElement(
  scene: Scene,
  id: string,
): { scene: Scene; ids: string[] } {
  const group = scene.elements.find((el) => el.id === id);
  if (group?.kind !== "group") return { scene, ids: [] };
  const children = group.children.map((child) => placeChild(child, group));
  return {
    scene: {
      ...scene,
      elements: scene.elements.flatMap((el) =>
        el.id === id ? children : [el],
      ),
    },
    ids: children.map((el) => el.id),
  };
}

/**
 * A copy of `group` standing alone, as a preset stores it: a line inside that is attached to
 * something outside the group keeps that end where its stored point is.
 */
export function detachOutside(group: GroupEl): GroupEl {
  const inside = new Set(idsWithin(group));
  const detach = (el: Element): Element => {
    if (el.kind === "group")
      return { ...el, children: el.children.map(detach) };
    if (el.kind !== "line") return el;
    const end = (ep: typeof el.a) =>
      ep.attach && !inside.has(ep.attach) ? { x: ep.x, y: ep.y } : ep;
    return { ...el, a: end(el.a), b: end(el.b) };
  };
  return detach(structuredClone(group)) as GroupEl;
}
