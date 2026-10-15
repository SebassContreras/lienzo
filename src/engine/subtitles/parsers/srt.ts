import type { SubtitleCue, SubtitleParser } from "../types.ts";

/**
 * Parses an SRT timestamp format: HH:MM:SS,mmm or HH:MM:SS.mmm into fractional seconds.
 */
export function parseSrtTimestamp(timestamp: string): number {
  const clean = timestamp.trim().replace(",", ".");
  const parts = clean.split(":");
  if (parts.length === 3) {
    const hours = Number.parseFloat(parts[0]) || 0;
    const minutes = Number.parseFloat(parts[1]) || 0;
    const seconds = Number.parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const minutes = Number.parseFloat(parts[0]) || 0;
    const seconds = Number.parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  return Number.parseFloat(clean) || 0;
}

/**
 * Pure SRT (SubRip) subtitle format parser.
 * Handles standard line breaks, BOM markers, multi-line cue texts, and comma/dot milliseconds.
 */
export function parseSrt(content: string): SubtitleCue[] {
  // Strip UTF-8 BOM if present
  const normalized = content
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const blocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) continue;

    // Check if first line is numeric index or timestamp
    let timeLineIndex = 0;
    if (/^\d+$/.test(lines[0]) && lines.length > 1) {
      timeLineIndex = 1;
    }

    const timeLine = lines[timeLineIndex];
    if (!timeLine?.includes("-->")) {
      continue;
    }

    const [startRaw, endRaw] = timeLine.split("-->").map((s) => s.trim());
    const start = parseSrtTimestamp(startRaw);
    const end = parseSrtTimestamp(endRaw);

    const textLines = lines.slice(timeLineIndex + 1);
    const text = textLines.join(" ");

    if (text.length > 0 && !Number.isNaN(start) && !Number.isNaN(end)) {
      cues.push({
        id:
          lines[0] && timeLineIndex === 1 ? lines[0] : `cue-${cues.length + 1}`,
        start,
        end,
        text,
      });
    }
  }

  return cues;
}

export const srtParser: SubtitleParser = {
  parse: parseSrt,
};
