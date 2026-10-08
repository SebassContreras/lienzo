import { slugify } from "./slug.ts";

/** Downloads `data` as `<name>.json`. */
export function downloadJson(name: string, data: unknown): void {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(name)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** The parsed contents of a chosen file; rejects with a readable message if it is not JSON. */
export async function readJsonFile(file: File): Promise<unknown> {
  const text = await file.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`«${file.name}» no es un JSON válido`);
  }
}

/** `base`, or `base-2`, `base-3`… — the first slug not in `taken`. */
export function freeSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const slug = slugify(base);
  let candidate = slug;
  for (let n = 2; used.has(candidate); n++) candidate = `${slug}-${n}`;
  return candidate;
}

/** A multi-line validation message on one line, for the status bar. */
export function oneLine(message: string): string {
  return message.split("\n").join(" · ");
}
