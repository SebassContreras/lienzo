/**
 * Row-by-row reveal (017/D2): with `reveal` going 0→1, item `i` of `n` fades in during its
 * own slice of the range, so a list or a table appears one row after another.
 */
export const rowAlpha = (reveal: number, i: number, n: number): number =>
  Math.min(1, Math.max(0, reveal * n - i));

/** The non-empty, trimmed lines of `text`: list items, table rows, steps, chart data. */
export const linesOf = (text: string): string[] =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
