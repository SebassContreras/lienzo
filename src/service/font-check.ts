import { type MeasureStyle, widthIsEstimated } from "../engine/text-measure.ts";
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

export type TextLike = Extract<Element, { kind: "text" | "subtitles" }>;

/** Every `text` and `subtitles` element of the scene, symbols included. */
function* textElements(scene: Scene): Generator<TextLike> {
  const roots = [
    ...scene.elements,
    ...Object.values(scene.symbols ?? {}).flatMap((s) => s.children),
  ];
  for (const el of allElements(roots)) {
    if (el.kind === "text" || el.kind === "subtitles") yield el;
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
  for (const el of textElements(scene)) {
    if (!known.has(el.font.toLowerCase())) missing.add(el.font);
  }
  return [...missing];
}

/** The style `measureTextWidth` is called with for `el`; subtitles have no italic. */
export function measureStyleOf(el: TextLike): MeasureStyle {
  return {
    font: el.font,
    size: el.size,
    weight: el.weight,
    italic: el.kind === "text" ? el.italic : false,
  };
}

/** Font families whose text width is estimated here, with no metrics, in first-seen order (064/D3). */
export function estimatedFonts(scene: Scene): string[] {
  const estimated = new Set<string>();
  for (const el of textElements(scene)) {
    if (widthIsEstimated(measureStyleOf(el))) estimated.add(el.font);
  }
  return [...estimated];
}

/** One warning per family measured by the estimate, naming how to check it (064/D3). */
export function estimatedWidthNotices(scene: Scene): string[] {
  return estimatedFonts(scene).map(
    (family) =>
      `El ancho del texto en «${family}» es una estimación (no hay métricas de esa fuente); ` +
      "compruébalo con scene_preview, no con scene_inspect_layout",
  );
}

/** One warning per missing family, naming the fix (060/D6). */
export function fontNotices(
  scene: Scene,
  installed: readonly string[],
): string[] {
  return missingFonts(scene, installed).map(missingFontNotice);
}

/** The notice for a font family that is not installed (070/D2). */
export const missingFontNotice = (family: string) =>
  `La fuente «${family}» no está instalada; se dibujará con otra. Usa font_install`;
