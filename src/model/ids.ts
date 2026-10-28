/** Element ids are unique among the elements of one scene at any depth (081/D2). Pure. */
import type { Element } from "./model.ts";

/** An id seen again: where it was first seen and where it is seen again, as `elements.0.children.1`. */
export type Repeat = { id: string; first: string; path: string };

/** Every element (group children included) whose id an earlier one already has, in tree order. */
export function duplicateIds(
  elements: readonly Element[],
  prefix = "elements",
): Repeat[] {
  const seen = new Map<string, string>();
  const repeats: Repeat[] = [];
  const walk = (list: readonly Element[], at: string) => {
    for (const [i, el] of list.entries()) {
      const path = `${at}.${i}`;
      // checked, as the rules also read scenes that did not parse (075/D3)
      const first = typeof el?.id === "string" ? seen.get(el.id) : undefined;
      if (first !== undefined) repeats.push({ id: el.id, first, path });
      else if (typeof el?.id === "string") seen.set(el.id, path);
      if (el?.kind === "group" && Array.isArray(el.children))
        walk(el.children, `${path}.children`);
    }
  };
  walk(elements, prefix);
  return repeats;
}
