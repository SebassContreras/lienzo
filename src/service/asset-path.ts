/**
 * The one check for asset paths inside a project's `assets/` (044/D2): every segment is a
 * plain name (letters, digits, `_`, `-`, `.`, not starting with a dot), so `..`, empty and
 * absolute segments never pass. Returns the POSIX path relative to `assets/`, or undefined.
 */
const SEGMENT = /^[\w][\w.-]*$/;

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

/** The part of an asset reference after `/assets/` (or the whole reference), split on `/`. */
export function assetSegments(ref: string): string[] {
  const normalized = ref.trim().replace(/\\/g, "/").split(/[?#]/)[0] ?? "";
  const match = /(?:^|\/)assets\//.exec(normalized);
  const tail = match
    ? normalized.slice(match.index + match[0].length)
    : normalized;
  return tail.split("/");
}

/** URL of a project asset, each segment encoded on its own so subfolders keep their `/`. */
export function projectAssetUrl(slug: string, path: string): string {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `/api/projects/${encodeURIComponent(slug)}/assets/${encoded}`;
}
