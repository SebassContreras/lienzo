/**
 * Keys the schema dropped (063/D5): Zod objects strip unknown keys silently, so the raw input
 * is walked next to the parsed value and every key present only in the input is listed by
 * its path (`elements.3.glw`). Plain data in, plain data out — no Zod internals.
 */
export function ignoredPaths(
  input: unknown,
  parsed: unknown,
  prefix = "",
): string[] {
  if (Array.isArray(input) && Array.isArray(parsed)) {
    return input.flatMap((item, i) =>
      ignoredPaths(item, parsed[i], join(prefix, String(i))),
    );
  }
  if (!isRecord(input) || !isRecord(parsed)) return [];
  return Object.keys(input).flatMap((key) =>
    key in parsed
      ? ignoredPaths(input[key], parsed[key], join(prefix, key))
      : [join(prefix, key)],
  );
}

const join = (prefix: string, key: string) =>
  prefix ? `${prefix}.${key}` : key;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** The notice for one ignored key. */
export const ignoredNotice = (path: string) =>
  `Campo desconocido ignorado: ${path}`;
