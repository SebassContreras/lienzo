import type { SubtitleCue, SubtitleWord } from "../types.ts";

/**
 * Parses a WebVTT timestamp format: MM:SS.mmm or HH:MM:SS.mmm into fractional seconds.
 */
function parseVttTimestamp(timestamp: string): number {
  const clean = timestamp.trim();
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
 * Parses word-level timestamps in WebVTT cues (e.g. `<00:01.200>word` or `word<00:01.200>`).
 * Returns an array of SubtitleWords if karaoke tags are found.
 */
export function extractVttWords(
  text: string,
  cueStart: number,
  cueEnd: number,
): { cleanText: string; words?: SubtitleWord[] } {
  // Check for inline timestamps like <00:01.500> or <00:00:01.500>
  const tagRegex = /<(\d{2}:)?\d{2}:\d{2}\.\d{3}>/g;
  if (!tagRegex.test(text)) {
    return { cleanText: text };
  }

  // Parse token stream of words and timestamps
  const tokens = text
    .split(/(<(?:\d{2}:)?\d{2}:\d{2}\.\d{3}>)/g)
    .filter((t) => t.length > 0);
  const words: SubtitleWord[] = [];
  let currentStart = cueStart;

  for (const token of tokens) {
    const match = token.match(/^<((?:\d{2}:)?\d{2}:\d{2}\.\d{3})>$/);
    if (match?.[1]) {
      currentStart = parseVttTimestamp(match[1]);
    } else {
      const trimmed = token.trim();
      if (trimmed.length > 0) {
        words.push({
          word: trimmed,
          start: currentStart,
          end: cueEnd, // Will be adjusted by subsequent word's start or final cueEnd
        });
      }
    }
  }

  // Refine word end boundaries based on the next word's start
  for (let i = 0; i < words.length - 1; i++) {
    const nextStart = words[i + 1]?.start;
    if (nextStart !== undefined && nextStart > words[i]?.start) {
      words[i]!.end = nextStart;
    }
  }

  const cleanText = text
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return {
    cleanText,
    words: words.length > 0 ? words : undefined,
  };
}

/**
 * Pure WebVTT subtitle format parser with karaoke / word-level timing support.
 */
export function parseVtt(content: string): SubtitleCue[] {
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

    // Skip WEBVTT header and NOTE / STYLE blocks
    if (
      lines[0]?.startsWith("WEBVTT") ||
      lines[0]?.startsWith("NOTE") ||
      lines[0]?.startsWith("STYLE")
    ) {
      continue;
    }

    let timeLineIndex = 0;
    if (!lines[0]?.includes("-->") && lines.length > 1) {
      timeLineIndex = 1;
    }

    const timeLine = lines[timeLineIndex];
    if (!timeLine?.includes("-->")) {
      continue;
    }

    const [startRaw, rest] = timeLine.split("-->").map((s) => s.trim());
    // Strip cue settings (e.g. line:0% position:50% align:center)
    const endRaw = rest?.split(/\s+/)[0] ?? "";
    const start = parseVttTimestamp(startRaw ?? "");
    const end = parseVttTimestamp(endRaw);

    const rawTextLines = lines.slice(timeLineIndex + 1);
    const rawText = rawTextLines.join(" ");

    const { cleanText, words } = extractVttWords(rawText, start, end);

    if (cleanText.length > 0 && !Number.isNaN(start) && !Number.isNaN(end)) {
      cues.push({
        id:
          lines[0] && timeLineIndex === 1 ? lines[0] : `cue-${cues.length + 1}`,
        start,
        end,
        text: cleanText,
        words,
      });
    }
  }

  return cues;
}
