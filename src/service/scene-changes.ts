/**
 * What a scene write changed (071/D3): every element of a scene and a test for whether the
 * previous scene had it the same. Shared by the reference checks and the resource notices.
 */
import type { Element, Scene } from "../model/model.ts";

/** Every element of `scene` with its path (`elements.0.children.1`, `symbols.s.children.0`). */
export function placedElements(scene: Scene): { el: Element; path: string }[] {
  const out: { el: Element; path: string }[] = [];
  const walk = (list: readonly Element[], prefix: string) => {
    for (const [i, el] of list.entries()) {
      out.push({ el, path: `${prefix}.${i}` });
      // checked, as the rules also read scenes that did not parse (075/D3)
      if (el.kind === "group" && Array.isArray(el.children))
        walk(el.children, `${prefix}.${i}.children`);
    }
  };
  walk(scene.elements, "elements");
  for (const [name, symbol] of Object.entries(scene.symbols ?? {}))
    if (Array.isArray(symbol?.children))
      walk(symbol.children, `symbols.${name}.children`);
  return out;
}

/** Every element of `scene`, group children and symbol children included. */
export const allElements = (scene: Scene): Element[] =>
  placedElements(scene).map(({ el }) => el);

/** Whether an element is new or differs from `previous` (always, with no `previous`). */
export function changedSince(
  previous: Scene | undefined,
): (el: Element) => boolean {
  if (!previous) return () => true;
  const before = new Map(
    allElements(previous).map((el) => [el.id, JSON.stringify(el)]),
  );
  return (el) => before.get(el.id) !== JSON.stringify(el);
}

/** The ids of every element of `scene`, or none without one. */
export const idsOf = (scene: Scene | undefined): Set<string> =>
  new Set(scene ? allElements(scene).map((el) => el.id) : []);
