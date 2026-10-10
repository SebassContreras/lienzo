import type { RevealUnit } from "../../animations/index.ts";

/** What shows of one line: whole units, then the unit fading in (if any) at `alpha`. */
export type ShownLine = {
  text: string;
  partial?: { text: string; alpha: number };
};

/** The end index of every unit of `line`; a word keeps the spaces after it. */
function unitEnds(line: string, unit: RevealUnit): number[] {
  if (unit === "line") return [line.length];
  if (unit === "word")
    return [...line.matchAll(/\s*\S+\s*/g)].map((m) => m.index + m[0].length);
  const ends: number[] = [];
  let i = 0;
  for (const ch of line) {
    i += ch.length;
    ends.push(i);
  }
  return ends;
}

/**
 * How much of each line shows when `reveal` (0–1) of the text's units are revealed, counted
 * across lines in reading order (018/D8). Soft reveals fade the next unit in; others don't.
 */
export function revealLines(
  lines: readonly string[],
  reveal: number,
  unit: RevealUnit,
  soft: boolean,
): ShownLine[] {
  const ends = lines.map((l) => unitEnds(l, unit));
  const total = ends.reduce((n, e) => n + e.length, 0);
  const shown = Math.min(1, Math.max(0, reveal)) * total;
  let before = 0;
  return lines.map((line, i) => {
    const e = ends[i] as number[];
    const whole = Math.min(e.length, Math.max(0, Math.floor(shown - before)));
    const end = whole > 0 ? (e[whole - 1] as number) : 0;
    const out: ShownLine = { text: line.slice(0, end) };
    const alpha = shown - before - whole;
    if (soft && whole < e.length && alpha > 0)
      out.partial = { text: line.slice(end, e[whole]), alpha };
    before += e.length;
    return out;
  });
}
