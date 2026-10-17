import { roundToMs } from "./sync.ts";
import type { SubtitleCue, SubtitleWord } from "./types.ts";

/**
 * Regular expression matching pause tokens in cue text:
 * Supports formats like `[0.5s]`, `[0.5]`, `[pause:0.5s]`, `[pause:0.5]`, `[p:500ms]`
 */
const PAUSE_REGEX = /^\[(?:pause:|p:)?(\d+(?:\.\d+)?)(s|ms)?\]$/i;

/**
 * Parses a raw token string to see if it represents a pause.
 * Returns the duration in seconds if it's a pause token, or null if it's a regular word.
 */
export function parsePauseDuration(token: string): number | null {
  const match = token.trim().match(PAUSE_REGEX);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (Number.isNaN(value) || value < 0) return null;
  const unit = match[2]?.toLowerCase();
  return unit === "ms" ? roundToMs(value / 1000) : roundToMs(value);
}

/**
 * Builds timed SubtitleCues from raw text containing potential pause tokens.
 *
 * Example input: `"Hola [0.8s] cómo estás"`
 * Result:
 * - Word "Hola": start = 0, end = 0.4s
 * - Pause 0.8s: advances current time cursor to 1.2s
 * - Word "cómo": start = 1.2s, end = 1.6s
 * - Word "estás": start = 1.6s, end = 2.0s
 * - cue.text: `"Hola cómo estás"` (clean, rendered on canvas without tokens)
 *
 * @param rawText User-edited text containing words and optional [0.5s] pause tokens.
 * @param start Start timestamp in seconds.
 * @param speedFactor Speech tempo multiplier (> 0).
 * @param existingCue Optional existing SubtitleCue to preserve ID.
 */
export function parseTextWithPauses(
  rawText: string,
  start: number = 0,
  speedFactor: number = 1.0,
  existingCue?: SubtitleCue,
): SubtitleCue[] {
  const cleanStart = Math.max(0, roundToMs(start));
  const tokens = rawText.trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return [
      {
        id: existingCue?.id ?? `cue-${Date.now()}`,
        start: cleanStart,
        end: roundToMs(cleanStart + 1.5),
        text: "",
      },
    ];
  }

  // Base speech rate: ~0.4s per word scaled by speedFactor
  const wordDuration = Math.max(
    0.15,
    roundToMs(0.4 / Math.max(0.1, speedFactor)),
  );

  let cursor = cleanStart;
  const words: SubtitleWord[] = [];
  const cleanTokens: string[] = [];

  for (const token of tokens) {
    const pauseSecs = parsePauseDuration(token);
    if (pauseSecs !== null) {
      // Add pause duration to cursor without generating a visible word
      cursor = roundToMs(cursor + pauseSecs);
    } else {
      const wStart = roundToMs(cursor);
      const wEnd = roundToMs(wStart + wordDuration);
      words.push({
        word: token,
        start: wStart,
        end: wEnd,
      });
      cleanTokens.push(token);
      cursor = wEnd;
    }
  }

  // Fallback if the user typed only pause tokens
  const cleanText = cleanTokens.join(" ");
  const totalEnd =
    words.length > 0
      ? words[words.length - 1].end
      : roundToMs(cleanStart + 1.5);

  return [
    {
      id: existingCue?.id ?? `cue-${Date.now()}`,
      start: cleanStart,
      end: Math.max(cleanStart, totalEnd),
      text: cleanText,
      words: words.length > 0 ? words : undefined,
    },
  ];
}

/**
 * Converts an array of timed SubtitleWords or SubtitleCues back into an editable string
 * with explicit pause tokens inserted wherever silence gaps exist between words.
 *
 * @param words Array of SubtitleWord timestamps.
 * @param minGapThreshold Minimum gap in seconds to be formatted as an explicit pause (defaults to 0.2s).
 */
export function wordsToTextWithPauses(
  words?: SubtitleWord[],
  minGapThreshold: number = 0.2,
): string {
  if (!words || words.length === 0) return "";

  const parts: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const current = words[i];
    if (i > 0) {
      const prev = words[i - 1];
      const gap = roundToMs(current.start - prev.end);
      if (gap >= minGapThreshold) {
        parts.push(`[${gap}s]`);
      }
    }
    parts.push(current.word);
  }

  return parts.join(" ");
}

/**
 * Converts full SubtitleCue array into single editor text with pause tokens between words and cues.
 */
export function cuesToTextWithPauses(
  cues: SubtitleCue[],
  minGapThreshold: number = 0.2,
): string {
  if (!cues || cues.length === 0) return "";

  // Collect all words across all cues
  const allWords: SubtitleWord[] = [];

  for (const cue of cues) {
    if (cue.words && cue.words.length > 0) {
      allWords.push(...cue.words);
    } else if (cue.text.trim()) {
      // If cue has no word breakdown, create synthetic words spanning cue.start to cue.end
      const tokens = cue.text.trim().split(/\s+/).filter(Boolean);
      const cueDur = Math.max(0.1, cue.end - cue.start);
      const perWordDur = cueDur / Math.max(1, tokens.length);
      let cur = cue.start;
      for (const t of tokens) {
        const wEnd = cur + perWordDur;
        allWords.push({ word: t, start: roundToMs(cur), end: roundToMs(wEnd) });
        cur = wEnd;
      }
    }
  }

  return wordsToTextWithPauses(allWords, minGapThreshold);
}
