/**
 * Breaks `text` into lines no wider than `maxW` as `measure` sees them, at spaces; explicit
 * line breaks are kept and a word longer than the width gets a line of its own.
 */
export function wrapLines(
  text: string,
  maxW: number,
  measure: (s: string) => number,
): string[] {
  return text.split("\n").flatMap((para) => {
    const lines: string[] = [];
    let line = "";
    for (const word of para.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (line && measure(next) > maxW) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
    return lines;
  });
}
