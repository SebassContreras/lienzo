/**
 * The one check for asset paths inside a project's `assets/` (044/D2): every segment starts
 * with a letter, digit or `_`, may hold letters, marks, digits, spaces and `_ . , - ( ) & ' +`,
 * and does not end in a space or a dot (Windows would alias it), so `..`, empty and absolute
 * segments, separators and reserved characters never pass. Returns the POSIX path relative to
 * `assets/`, or undefined.
 */
const SEGMENT =
  /^[\p{L}\p{N}_](?:[\p{L}\p{M}\p{N}_ .,()&'+-]*[\p{L}\p{M}\p{N}_,()&'+-])?$/u;

export function safeAssetPath(segments: readonly string[]): string | undefined {
  if (segments.length === 0) return undefined;
  const decoded: string[] = [];
  for (const segment of segments) {
    let name: string;
    try {
      name = decodeURIComponent(segment);
    } catch {
      return undefined;
    }
    if (!SEGMENT.test(name)) return undefined;
    decoded.push(name);
  }
  return decoded.join("/");
}

/**
 * The prefix of an asset reference up to its `assets/` folder: `/projects/<slug>/assets/`,
 * `/api/projects/<slug>/assets/` or `assets/`. Anchored, so a project whose slug is itself
 * `assets` is not mistaken for the folder (063/D10).
 */
export const ASSETS_PREFIX = /^\/?(?:(?:api\/)?projects\/[^/]+\/)?assets\//;

/** The part of an asset reference after its `assets/` prefix (or the whole reference), split on `/`. */
export function assetSegments(ref: string): string[] {
  const normalized = ref.trim().replace(/\\/g, "/").split(/[?#]/)[0] ?? "";
  const prefix = ASSETS_PREFIX.exec(normalized)?.[0] ?? "";
  return normalized.slice(prefix.length).split("/");
}

/** URL of a project asset, each segment encoded on its own so subfolders keep their `/`. */
export function projectAssetUrl(slug: string, path: string): string {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `/api/projects/${encodeURIComponent(slug)}/assets/${encoded}`;
}
