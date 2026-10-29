/**
 * `path` with its leading `elements.N(.children.M)*` indices replaced by the element's id
 * path (`elements.g/child.w`), as other errors name elements (073/D3). `data` is the input
 * as the caller gave it, so an element it gave no id keeps its index (074/D9), and so does
 * one whose id a sibling repeats, since the id would name both (080/D6).
 */
export function idPath(data: unknown, path: string): string {
  const parts = path.split(".");
  const symbol = parts[0] === "symbols" && parts[2] === "children";
  if (parts[0] !== "elements" && !symbol) return path;
  const head = symbol ? parts.slice(0, 3) : parts.slice(0, 1);
  const ids: string[] = [];
  let list = symbol
    ? (data as { symbols?: Record<string, { children?: unknown }> })?.symbols?.[
        parts[1] as string
      ]?.children
    : (data as { elements?: unknown })?.elements;
  let i = head.length;
  while (Array.isArray(list) && /^\d+$/.test(parts[i] ?? "")) {
    const id = (list[Number(parts[i])] as { id?: unknown } | undefined)?.id;
    const twice = (list as { id?: unknown }[]).filter((el) => el?.id === id);
    if (typeof id !== "string" || twice.length > 1) return path;
    ids.push(id);
    i++;
    if (parts[i] !== "children") break;
    list = (list[Number(parts[i - 1])] as { children?: unknown }).children;
    i++;
  }
  if (ids.length === 0) return path;
  return [...head, ids.join("/"), ...parts.slice(i)].join(".");
}
