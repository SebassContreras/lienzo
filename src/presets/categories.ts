/** Shown for presets without a category, when others have one. */
export const NO_CATEGORY = "Sin categoría";

/** Items whose name contains `query`, ignoring case and accents. */
export function filterByName<T extends { name: string }>(
  items: T[],
  query: string,
): T[] {
  const fold = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const q = fold(query.trim());
  return q ? items.filter((item) => fold(item.name).includes(q)) : items;
}

/**
 * One section per category, in the order categories first appear; presets without one go
 * last under `NO_CATEGORY`. With no categories at all, a single section titled "".
 */
export function groupByCategory<T extends { category?: string }>(
  items: T[],
): { category: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  const loose: T[] = [];
  for (const item of items) {
    const c = item.category?.trim();
    if (!c) loose.push(item);
    else groups.set(c, [...(groups.get(c) ?? []), item]);
  }
  const sections = [...groups].map(([category, items]) => ({
    category,
    items,
  }));
  if (loose.length > 0) {
    sections.push({
      category: sections.length ? NO_CATEGORY : "",
      items: loose,
    });
  }
  return sections;
}
