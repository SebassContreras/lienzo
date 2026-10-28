import {
  type MeasureStyle,
  widthIsEstimated,
} from "../../engine/text-measure.ts";
import { matchedWeight } from "../../model/fonts.ts";
import type { Element, Scene } from "../../model/model.ts";

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

/** A face of an installed font: one family at one weight. */
export type Face = { family: string; weight: number };

/** A text or subtitles weight its installed family lacks, and the weight drawn instead. */
export type MissingWeight = { family: string; weight: number; drawn: number };

/**
 * Weights that `text` and `subtitles` elements ask of an installed family that does not
 * have them, once per family and weight, with the weight the browser draws (080/D16). Pure.
 */
export function missingWeights(
  scene: Scene,
  installed: readonly Face[],
): MissingWeight[] {
  const found = new Map<string, MissingWeight>();
  for (const el of textElements(scene)) {
    const have = installed
      .filter((f) => f.family.toLowerCase() === el.font.toLowerCase())
      .map((f) => f.weight);
    if (have.length === 0 || have.includes(el.weight)) continue;
    found.set(`${el.font}:${el.weight}`, {
      family: el.font,
      weight: el.weight,
      drawn: matchedWeight(have, el.weight),
    });
  }
  return [...found.values()];
}

/** The notice for a weight an installed family lacks (080/D16). */
export const missingWeightNotice = (w: MissingWeight) =>
  `${w.family} no tiene peso ${w.weight}; se dibuja ${w.drawn}`;

/** One warning per missing family or weight, naming the fix (060/D6, 080/D16). */
export function fontNotices(
  scene: Scene,
  installed: readonly Face[],
): string[] {
  return [
    ...missingFonts(
      scene,
      installed.map((f) => f.family),
    ).map(missingFontNotice),
    ...missingWeights(scene, installed).map(missingWeightNotice),
  ];
}

/**
 * One notice per installed brand font whose declared weights are not all installed (081/D8):
 * `font_install` takes only 400 unless `weights` says more.
 */
export function missingBrandWeightNotices(
  fonts: readonly { family: string; weights: readonly number[] }[],
  installed: readonly Face[],
): string[] {
  return fonts.flatMap((f) => {
    const have = installed
      .filter((i) => i.family === f.family)
      .map((i) => i.weight);
    const lacking = f.weights.filter((w) => !have.includes(w));
    return have.length > 0 && lacking.length > 0
      ? [
          `La fuente de marca «${f.family}» declara los pesos ${lacking.join(", ")}, que no están instalados; instálalos con font_install y el parámetro weights`,
        ]
      : [];
  });
}

/** The notice for a font family that is not installed (070/D2). */
export const missingFontNotice = (family: string) =>
  `La fuente «${family}» no está instalada; se dibujará con otra. Usa font_install`;
