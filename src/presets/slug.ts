/**
 * Names as file and URL names (074/D6): lowercase ASCII, accents folded (`Ámbar` → `ambar`,
 * as Django's and npm `slugify` fold them), any other run of characters one `-`.
 */
const fold = (text: string, keep: RegExp) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(keep, "-")
    .replace(/^-+|-+$/g, "");

/** File-name-safe version of a preset or scene name: `"Tarjeta Neón!"` → `"tarjeta-neon"`. */
export function slugify(name: string): string {
  return fold(name, /[^a-z0-9-_]+/g) || "untitled";
}

/** Whether two names are the same name for a lookup: case, accents and punctuation folded (081/D7). */
export const sameName = (a: string, b: string): boolean =>
  slugify(a) === slugify(b);

/** A project id from its name (letters, digits and `-` only); empty when nothing is left. */
export function projectSlug(name: string): string {
  return fold(name, /[^a-z0-9]+/g);
}

/** The slug before 074, which dropped accented letters: read-only, to find older files. */
export function legacySlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}
