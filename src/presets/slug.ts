/** File-name-safe version of a preset or scene name: `"Tarjeta Neón!"` → `"tarjeta-ne-n"`. */
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}
