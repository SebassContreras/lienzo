/**
 * User fonts in the page (045/D3): the editor and the `?render` route both call
 * `loadFonts`, so preview and export draw with the same files (A3). Browser only.
 */

import { type ResolvedFont, resolveFonts } from "../model/font-files.ts";
import { FONTS } from "../model/fonts.ts";
import type { Scene } from "../model/model.ts";

/** Faces this page added, by URL; replaced when the project changes. */
const added = new Map<string, FontFace>();

/** Every usable font for `project` (bundled, global, project), as the font API lists them. */
export async function fetchFonts(
  project?: string,
  get: typeof fetch = fetch,
): Promise<ResolvedFont[]> {
  const query = project ? `?project=${encodeURIComponent(project)}` : "";
  const res = await get(`/api/fonts${query}`);
  if (!res.ok) throw new Error(`/api/fonts: ${res.status}`);
  return (await res.json()) as ResolvedFont[];
}

/** Registers the user fonts of `project` and drops those of the previous one. */
export async function loadFonts(project?: string): Promise<ResolvedFont[]> {
  // Without the font API (a static build), the bundled fonts are all there is.
  const fonts = await fetchFonts(project).catch(() => resolveFonts(FONTS, []));
  const wanted = new Set(fonts.flatMap((f) => (f.url ? [f.url] : [])));
  for (const [url, face] of added) {
    if (!wanted.has(url)) {
      document.fonts.delete(face);
      added.delete(url);
    }
  }
  await Promise.all(
    fonts.map(async ({ family, weight, url }) => {
      if (!url || added.has(url)) return;
      const face = new FontFace(family, `url("${url}")`, {
        weight: String(weight),
      });
      try {
        document.fonts.add(await face.load());
        added.set(url, face);
      } catch {
        // a broken file: the family falls back like a missing one (045/R6)
      }
    }),
  );
  return fonts;
}

/** Every font family a scene's elements name (any `font` field, at any depth). */
export function sceneFontFamilies(scene: Scene): string[] {
  const found = new Set<string>();
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const v of value) walk(v);
    } else if (value && typeof value === "object") {
      for (const [key, v] of Object.entries(value)) {
        if (key === "font" && typeof v === "string" && v) found.add(v);
        else walk(v);
      }
    }
  };
  walk(scene.elements);
  return [...found].sort();
}

/** Families the scene names that no available font provides (045/R6). */
export function missingFonts(
  scene: Scene,
  available: readonly ResolvedFont[],
): string[] {
  const families = new Set(available.map((f) => f.family));
  return sceneFontFamilies(scene).filter((f) => !families.has(f));
}
