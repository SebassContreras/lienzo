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

/**
 * Why `id` cannot name an element or a shot, or `undefined` when it can (084/D1). Tools
 * address an element by `id` or a `group/child` path, so an id has no `/`; it is not empty or
 * padded and holds no control character. Spaces inside and accents are fine. Pure.
 */
export function idProblem(id: unknown): string | undefined {
  if (typeof id !== "string") return undefined; // the schema reports it
  if (id === "") return "un id no puede estar vacío";
  if (id !== id.trim()) return "un id no puede empezar ni acabar con espacios";
  if (id.includes("/"))
    return "un id no puede llevar «/», que separa grupo e hijo en una ruta";
  // biome-ignore lint/suspicious/noControlCharactersInRegex: that is the rule
  if (/[\u0000-\u001f\u007f]/.test(id))
    return "un id no puede llevar caracteres de control";
  return undefined;
}
