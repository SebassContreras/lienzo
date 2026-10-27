/**
 * `path` with its leading `elements.N(.children.M)*` indices replaced by the element's id
 * path (`elements.g/child.w`), as other errors name elements (073/D3). `data` is the input
 * as the caller gave it, so an element it gave no id keeps its index (074/D9).
 */
export function idPath(data: unknown, path: string): string {
  const parts = path.split(".");
  if (parts[0] !== "elements") return path;
  const ids: string[] = [];
  let list = (data as { elements?: unknown })?.elements;
  let i = 1;
  while (Array.isArray(list) && /^\d+$/.test(parts[i] ?? "")) {
    const id = (list[Number(parts[i])] as { id?: unknown } | undefined)?.id;
    if (typeof id !== "string") return path;
    ids.push(id);
    i++;
    if (parts[i] !== "children") break;
    list = (list[Number(parts[i - 1])] as { children?: unknown }).children;
    i++;
  }
  if (ids.length === 0) return path;
  return ["elements", ids.join("/"), ...parts.slice(i)].join(".");
}
