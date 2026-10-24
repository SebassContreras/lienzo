import type { Element, Scene } from "../model/model.ts";

/** CSS generic families: keywords, never installable fonts. */
const GENERIC = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "system-ui",
  "cursive",
  "fantasy",
]);

/** Every element of the scene, inside groups and symbols too. */
function* allElements(elements: readonly Element[]): Generator<Element> {
  for (const el of elements) {
    yield el;
    const children = (el as { children?: unknown }).children;
    if (Array.isArray(children)) yield* allElements(children as Element[]);
  }
}

/**
 * Font families used by `text` and `subtitles` elements that aren't in `installed`, in
 * first-seen order (060/D5). Case-insensitive, as CSS matches family names. Pure.
 */
export function missingFonts(
  scene: Scene,
  installed: readonly string[],
): string[] {
  const known = new Set([...installed, ...GENERIC].map((f) => f.toLowerCase()));
  const missing = new Set<string>();
  const roots = [
    ...scene.elements,
    ...Object.values(scene.symbols ?? {}).flatMap((s) => s.children),
  ];
  for (const el of allElements(roots)) {
    if (el.kind !== "text" && el.kind !== "subtitles") continue;
    if (!known.has(el.font.toLowerCase())) missing.add(el.font);
  }
  return [...missing];
}

/** One warning per missing family, naming the fix (060/D6). */
export function fontNotices(
  scene: Scene,
  installed: readonly string[],
): string[] {
  return missingFonts(scene, installed).map(
    (family) =>
      `La fuente «${family}» no está instalada; se dibujará con otra. Usa font_install`,
  );
}
