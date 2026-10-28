import type {
  SubtitleCue,
  SubtitleWord,
} from "../../engine/subtitles/types.ts";

/**
 * Splits text into sentence/phrase chunks appropriate for subtitle cues.
 */
export function splitIntoSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Match sentence terminators (. ! ? ; \n) while keeping words together
  const rawChunks = trimmed
    .split(/(?<=[.!?;\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const sentences: string[] = [];
  for (const chunk of rawChunks) {
    // If a chunk is exceptionally long (> 12 words), subdivide it by commas or length
    const words = chunk.split(/\s+/).filter(Boolean);
    if (words.length > 12) {
      let current: string[] = [];
      for (const w of words) {
        current.push(w);
        if ((w.endsWith(",") || current.length >= 8) && current.length >= 4) {
          sentences.push(current.join(" "));
          current = [];
        }
      }
      if (current.length > 0) {
        sentences.push(current.join(" "));
      }
    } else {
      sentences.push(chunk);
    }
  }

  return sentences;
}

/**
 * Options for pure script-to-cue alignment.
 */
export interface AlignScriptOptions {
  /** Length of the audio clip in seconds; cues span `startOffset` to `startOffset + totalDuration`. */
  totalDuration: number;
  /** Initial delay before speech starts in seconds (default: 0). */
  startOffset?: number;
  /** Silence/padding between cues in seconds (default: 0.1). */
  gap?: number;
}

/**
 * Converts a text script and total audio duration into synchronized SubtitleCue[] (D4, R5).
 * Uses character-weight proportional timing and word breakdown for karaoke rendering.
 * Pure function adhering to Principle 1 (SRP) and Principle 5 (Pure function).
 */
export function alignScriptToCues(
  script: string,
  options: AlignScriptOptions,
): SubtitleCue[] {
  const { totalDuration, startOffset = 0, gap = 0.08 } = options;
  const sentences = splitIntoSentences(script);

  if (sentences.length === 0 || totalDuration <= 0) {
    return [];
  }

  // Weight each sentence by character length
  const charCounts = sentences.map((s) => Math.max(1, s.length));
  const totalChars = charCounts.reduce((acc, c) => acc + c, 0);

  // Available speech duration accounting for start offset and gaps
  const totalGapsDuration = Math.max(0, (sentences.length - 1) * gap);
  const netDuration = Math.max(
    0.1 * sentences.length,
    totalDuration - totalGapsDuration,
  );

  let currentTime = startOffset;
  const cues: SubtitleCue[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const text = sentences[i];
    const cueDuration = (charCounts[i] / totalChars) * netDuration;
    const cueStart = Math.round(currentTime * 100) / 100;
    const cueEnd = Math.round((cueStart + cueDuration) * 100) / 100;

    // Build word-level breakdowns within the cue
    const words = text.split(/\s+/).filter(Boolean);
    const wordCharCounts = words.map((w) => Math.max(1, w.length));
    const wordTotalChars = wordCharCounts.reduce((acc, c) => acc + c, 0);

    let wordCurrentTime = cueStart;
    const cueWords: SubtitleWord[] = [];

    for (let w = 0; w < words.length; w++) {
      const wText = words[w];
      const wDuration = (wordCharCounts[w] / wordTotalChars) * cueDuration;
      const wStart = Math.round(wordCurrentTime * 100) / 100;
      const wEnd = Math.round((wStart + wDuration) * 100) / 100;

      cueWords.push({
        word: wText,
        start: wStart,
        end: wEnd,
      });

      wordCurrentTime += wDuration;
    }

    cues.push({
      id: `cue-${i + 1}`,
      start: cueStart,
      end: cueEnd,
      text,
      words: cueWords,
    });

    currentTime = cueEnd + gap;
  }

  return cues;
}
