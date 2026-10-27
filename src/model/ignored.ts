import { createElement, descriptorOf } from "../components/index.ts";

/**
 * Keys the schema dropped (063/D5): Zod objects strip unknown keys silently, so the raw input
 * is walked next to the parsed value and every key present only in the input is listed by
 * its path (`elements.3.glw`). Plain data in, plain data out — no Zod internals.
 */
export function ignoredPaths(input: unknown, parsed: unknown): string[] {
  return ignoredFields(input, parsed).map((f) => f.path);
}

/** A dropped key and the field it most likely meant, among its object's own (067/D3). */
export type IgnoredField = { path: string; suggestion?: string };

/** Like `ignoredPaths`, with a suggested field for each key. */
export function ignoredFields(
  input: unknown,
  parsed: unknown,
  prefix = "",
): IgnoredField[] {
  if (Array.isArray(input) && Array.isArray(parsed)) {
    return input.flatMap((item, i) =>
      ignoredFields(item, parsed[i], join(prefix, String(i))),
    );
  }
  if (!isRecord(input) || !isRecord(parsed)) return [];
  return Object.keys(input).flatMap((key) => {
    if (key in parsed) {
      return ignoredFields(input[key], parsed[key], join(prefix, key));
    }
    const suggestion = closestKey(key, knownKeys(parsed));
    return [{ path: join(prefix, key), ...(suggestion ? { suggestion } : {}) }];
  });
}

/**
 * The keys `parsed` could hold: its own, and for an element every field of its kind, since a
 * compact element holds only the fields it sets.
 */
function knownKeys(parsed: Record<string, unknown>): string[] {
  const kind = typeof parsed.kind === "string" ? parsed.kind : undefined;
  const own = Object.keys(parsed);
  return kind && descriptorOf(kind)
    ? [...new Set([...own, ...Object.keys(createElement(kind as never))])]
    : own;
}

/**
 * The known key `key` most likely meant, or undefined: one it ends or starts with, as
 * `fontSize` ends with `size` (CSS names), else one a typo or two away (`colr`).
 */
export function closestKey(
  key: string,
  known: readonly string[],
): string | undefined {
  const k = normal(key);
  const longest = (fits: (c: string) => boolean) =>
    known
      .filter((c) => normal(c).length >= 4 && fits(normal(c)))
      .sort((a, b) => b.length - a.length)[0];
  const near = known
    .map((c) => ({ c, d: editDistance(k, normal(c)) }))
    .filter(
      ({ c, d }) => d > 0 && d <= Math.floor(Math.min(k.length, c.length) / 3),
    )
    .sort((a, b) => a.d - b.d)[0]?.c;
  return (
    longest((c) => k.endsWith(c)) ?? longest((c) => k.startsWith(c)) ?? near
  );
}

/** Lowercase letters and digits only, so `font_size` and `fontSize` compare equal. */
const normal = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Levenshtein distance: the fewest single-letter edits from `a` to `b`. */
function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        (prev[j] as number) + 1,
        (row[j - 1] as number) + 1,
        (prev[j - 1] as number) + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = row;
  }
  return prev[b.length] as number;
}

const join = (prefix: string, key: string) =>
  prefix ? `${prefix}.${key}` : key;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** The notice for one ignored key, naming the field it likely meant. */
export const ignoredNotice = ({ path, suggestion }: IgnoredField) =>
  `Campo desconocido ignorado: ${path}` +
  (suggestion ? ` (¿quisiste decir «${suggestion}»?)` : "");
