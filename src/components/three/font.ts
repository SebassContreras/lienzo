/**
 * The font 3D text is extruded from, behind a small adapter over opentype.js (A18): the rest
 * of the 3D code sees only outline commands, so the font library stays swappable.
 */
import opentype from "opentype.js";
import { assetFor, registerAssetLoader } from "../../engine/assets.ts";

/** One step of a glyph outline, in em units with y down (as fonts draw). */
export type OutlineCommand =
  | { type: "M" | "L"; x: number; y: number }
  | { type: "Q"; x1: number; y1: number; x: number; y: number }
  | {
      type: "C";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      x: number;
      y: number;
    }
  | { type: "Z" };

/**
 * The font file (Inter 700, OFL, copied from `@fontsource/inter` into `public/`); drawing
 * waits for it like for any asset. A plain path rather than a Vite `?url` import, so the
 * descriptors also load in Node (the CLI, 008).
 */
export const TEXT_FONT = "/fonts/inter-latin-700-normal.woff";

registerAssetLoader("woff", async (src) => {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`${src}: ${res.status}`);
  return opentype.parse(await res.arrayBuffer());
});

/**
 * The outline of `text` one em high, or undefined while the font loads. Glyphs are laid out
 * one by one with kerning: opentype.js throws on a GSUB format Inter uses, so its shaping
 * (ligatures) is skipped.
 */
export function textOutline(text: string): OutlineCommand[] | undefined {
  const font = assetFor<opentype.Font>(TEXT_FONT);
  if (!font) return undefined;
  const scale = 1 / font.unitsPerEm;
  const out: OutlineCommand[] = [];
  let x = 0;
  let previous: opentype.Glyph | undefined;
  for (const char of text) {
    const glyph = font.charToGlyph(char);
    if (previous) x += font.getKerningValue(previous, glyph) * scale;
    out.push(...(glyph.getPath(x, 0, 1).commands as OutlineCommand[]));
    x += (glyph.advanceWidth ?? 0) * scale;
    previous = glyph;
  }
  return out;
}
