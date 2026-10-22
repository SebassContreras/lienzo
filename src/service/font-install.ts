/**
 * Listing and adding fonts (045/D2, D5, D6), shared by the font routes and the font tools:
 * what a project can use, and the checks every new font file passes before the font
 * store writes it.
 */
import {
  type FontExtension,
  type FontFile,
  fontFileName,
  isFontExtension,
  isFontFamilyName,
  type ResolvedFont,
  resolveFonts,
} from "../model/font-files.ts";
import { FONTS } from "../model/fonts.ts";
import type { FontScope, FontStore } from "./font-store.ts";
import { downloadGoogleFont } from "./google-fonts.ts";

/** Every font a scene in `project` (or in no project) can use. */
export async function availableFonts(
  store: FontStore,
  project?: FontScope,
): Promise<ResolvedFont[]> {
  const [global, own] = await Promise.all([
    store.list(),
    project ? store.list(project) : [],
  ]);
  return resolveFonts(FONTS, global, own, project);
}

export const MAX_FONT_BYTES = 20 * 1024 * 1024;

export type NewFont = {
  family: string;
  weight: number;
  ext: string;
  /** Omitted = global `fonts/`. */
  project?: FontScope;
};

/** Why a new font is refused, or undefined when it is fine. */
function fontProblem(font: NewFont, bytes: number): string | undefined {
  if (!isFontFamilyName(font.family)) {
    return "Nombre de familia no válido (letras, números, espacios, _ y -)";
  }
  if (
    !Number.isInteger(font.weight) ||
    font.weight < 100 ||
    font.weight > 900
  ) {
    return "El peso debe ser un entero entre 100 y 900";
  }
  if (!isFontExtension(font.ext)) {
    return "Formato no soportado. Se esperaba: ttf, otf, woff, woff2";
  }
  if (bytes === 0) return "El archivo está vacío";
  if (bytes > MAX_FONT_BYTES) return "Archivo demasiado grande (máx 20MB)";
  return undefined;
}

/** Checks and stores one font file; throws with the reason when it is refused. */
export async function saveFont(
  store: FontStore,
  font: NewFont,
  data: Buffer,
): Promise<FontFile> {
  const problem = fontProblem(font, data.length);
  if (problem) throw new Error(problem);
  const ext = font.ext.toLowerCase() as FontExtension;
  const file = fontFileName(font.family, font.weight, ext);
  await store.write(file, data, font.project);
  return { family: font.family.trim(), weight: font.weight, file };
}

/** Downloads a Google Fonts family and stores each weight as `Family-Weight.woff2`. */
export async function installGoogleFont(
  store: FontStore,
  font: { family: string; weights: readonly number[]; project?: FontScope },
  get: typeof fetch,
): Promise<FontFile[]> {
  const problem = fontProblem(
    { family: font.family, weight: 400, ext: "woff2", project: font.project },
    1,
  );
  if (problem) throw new Error(problem);
  const files = await downloadGoogleFont(font.family, font.weights, get);
  return Promise.all(
    files.map(({ weight, data }) =>
      saveFont(
        store,
        { family: font.family, weight, ext: "woff2", project: font.project },
        data,
      ),
    ),
  );
}
