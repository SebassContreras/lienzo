/** Walking a scene's element tree, shared by the model and the tools (070/D2). Pure. */
import type { Element } from "./model.ts";

/** Recursively maps every element in the tree (post-order: children before group). */
export function mapElementsDeep(
  elements: readonly Element[],
  fn: (el: Element) => Element,
): Element[] {
  return elements.map((el) => {
    const mapped =
      el.kind === "group"
        ? ({ ...el, children: mapElementsDeep(el.children, fn) } as Element)
        : el;
    return fn(mapped);
  });
}
