/**
 * User font files (045/D1): the family and weight live in the file name,
 * `Family-Weight.ext` split on the last `-` (`Open Sans-700.woff2`), weight 400 when the
 * name has no numeric suffix. No manifest to keep in sync.
 */
import { BUNDLED_WEIGHTS } from "./fonts.ts";

const FONT_EXTENSIONS = ["ttf", "otf", "woff", "woff2"] as const;
export type FontExtension = (typeof FONT_EXTENSIONS)[number];

export type FontFile = { family: string; weight: number; file: string };

export function isFontExtension(ext: string): ext is FontExtension {
  return (FONT_EXTENSIONS as readonly string[]).includes(ext.toLowerCase());
}

export function parseFontFile(file: string): FontFile | undefined {
  const dot = file.lastIndexOf(".");
  if (dot <= 0 || !isFontExtension(file.slice(dot + 1))) return undefined;
  const stem = file.slice(0, dot);
  const dash = stem.lastIndexOf("-");
  const suffix = dash > 0 ? stem.slice(dash + 1) : "";
  if (/^\d{3}$/.test(suffix)) {
    return { family: stem.slice(0, dash).trim(), weight: Number(suffix), file };
  }
  return { family: stem.trim(), weight: 400, file };
}

/** The file name a font is stored under; the inverse of `parseFontFile`. */
export function fontFileName(
  family: string,
  weight: number,
  ext: FontExtension,
): string {
  return `${family.trim()}-${weight}.${ext}`;
}

/** Family names a user may give: letters, digits, spaces, `_` and `-`. */
export function isFontFamilyName(family: string): boolean {
  return /^[\p{L}\p{N}][\p{L}\p{N} _-]{0,63}$/u.test(family.trim());
}

export type FontOrigin = "bundled" | "global" | "project";
export type ResolvedFont = {
  family: string;
  weight: number;
  origin: FontOrigin;
  /** Where the file is served; bundled fonts are already in the page. */
  url?: string;
};

/** Where the font API serves a user font file. */
function fontUrl(file: string, project?: string): string {
  const name = encodeURIComponent(file);
  return project
    ? `/api/fonts/project/${encodeURIComponent(project)}/${name}`
    : `/api/fonts/global/${name}`;
}

/**
 * Every font a scene may use (045/D2): a family from the project hides the same family
 * from the global folder, and a user family hides a bundled one of the same name.
 */
export function resolveFonts(
  bundled: readonly string[],
  global: readonly FontFile[],
  project: readonly FontFile[] = [],
  projectSlug?: string,
): ResolvedFont[] {
  const projectFamilies = new Set(project.map((f) => f.family));
  const fromProject = project.map((f) => ({
    family: f.family,
    weight: f.weight,
    origin: "project" as const,
    url: fontUrl(f.file, projectSlug),
  }));
  const fromGlobal = global
    .filter((f) => !projectFamilies.has(f.family))
    .map((f) => ({
      family: f.family,
      weight: f.weight,
      origin: "global" as const,
      url: fontUrl(f.file),
    }));
  const user = new Set([...fromProject, ...fromGlobal].map((f) => f.family));
  const fromBundle = bundled
    .filter((family) => !user.has(family))
    .flatMap((family) =>
      (BUNDLED_WEIGHTS[family as keyof typeof BUNDLED_WEIGHTS] ?? [400]).map(
        (weight) => ({ family, weight, origin: "bundled" as const }),
      ),
    );
  return [...fromBundle, ...fromGlobal, ...fromProject];
}
