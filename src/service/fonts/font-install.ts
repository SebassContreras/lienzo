/**
 * Listing and adding fonts (045/D2, D5, D6), shared by the font routes and the font tools:
 * what a project can use, and the checks every new font file passes before the font
 * store writes it.
 */

import { setInstalledFonts } from "../../engine/text-measure.ts";
import {
  type FontExtension,
  type FontFile,
  fontFileName,
  isFontExtension,
  isFontFamilyName,
  type ResolvedFont,
  resolveFonts,
} from "../../model/font-files.ts";
import { FONTS } from "../../model/fonts.ts";
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

/**
 * Gives text measurement the installed fonts of `project` (global ones, then the project's,
 * which win), so layout checks use their glyphs instead of an estimate (067/D5). Returns the
 * files that cannot be measured (woff2).
 */
export async function measureInstalledFonts(
  store: FontStore,
  project?: FontScope,
): Promise<string[]> {
  const read = async (scope: FontScope) =>
    Promise.all(
      (await store.list(scope)).map(async ({ family, weight, file }) => ({
        family,
        weight,
        data: await store.read(file, scope),
      })),
    );
  const files = [
    ...(await read(undefined)),
    ...(project ? await read(project) : []),
  ];
  return setInstalledFonts(
    files.flatMap((f) => (f.data ? [{ ...f, data: f.data }] : [])),
  );
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

/** Downloads a Google Fonts family and stores each weight as `Family-Weight.ttf`. */
export async function installGoogleFont(
  store: FontStore,
  font: { family: string; weights: readonly number[]; project?: FontScope },
  get: typeof fetch,
): Promise<FontFile[]> {
  const problem = fontProblem(
    { family: font.family, weight: 400, ext: "ttf", project: font.project },
    1,
  );
  if (problem) throw new Error(problem);
  const files = await downloadGoogleFont(font.family, font.weights, get);
  return Promise.all(
    files.map(({ weight, data }) =>
      saveFont(
        store,
        { family: font.family, weight, ext: "ttf", project: font.project },
        data,
      ),
    ),
  );
}
