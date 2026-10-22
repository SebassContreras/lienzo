import type { SubtitleCue, SubtitleWord } from "./types.ts";

export interface WordWindowOptions {
  /** Maximum number of lines allowed (e.g. calculated from container height: Math.max(1, Math.floor(h / lineHeight))). */
  maxLines?: number;
  /** Maximum number of words to display in one active window (e.g. 3 to 6 words). */
  wordsPerWindow?: number;
}

/**
 * Paginates cue words into a window of words that fit within the active timing and container size.
 * Pure function adhering to Principle 1 (SRP) and Principle 5 (Pure function).
 *
 * For word-timed cues, it identifies the active word at time `t`, chunks words into
 * small pages (respecting wordsPerWindow or line budgets), and returns a virtual SubtitleCue
 * containing only the active page with its original timings preserved.
 */
export function paginateCueForTime(
  cue: SubtitleCue,
  t: number,
  options: WordWindowOptions = {},
): SubtitleCue {
  const words = cue.words;
  if (!words || words.length === 0) {
    // Untimed word cues: split text into chunks based on wordsPerWindow
    const rawWords = cue.text.split(/\s+/).filter((s) => s.length > 0);
    const chunkSize = Math.max(1, options.wordsPerWindow ?? 4);
    if (rawWords.length <= chunkSize) {
      return cue;
    }

    // Proportionally paginate across the cue duration
    const cueDuration = Math.max(0.1, cue.end - cue.start);
    const progress = Math.max(0, Math.min(1, (t - cue.start) / cueDuration));
    const totalChunks = Math.ceil(rawWords.length / chunkSize);
    const chunkIndex = Math.min(
      totalChunks - 1,
      Math.floor(progress * totalChunks),
    );
    const selectedWords = rawWords.slice(
      chunkIndex * chunkSize,
      (chunkIndex + 1) * chunkSize,
    );

    return {
      ...cue,
      text: selectedWords.join(" "),
      words: undefined,
    };
  }

  const chunkSize = Math.max(1, options.wordsPerWindow ?? 4);
  if (words.length <= chunkSize) {
    return cue;
  }

  // Find index of currently active word at time `t`
  let activeIndex = -1;
  for (let i = 0; i < words.length; i++) {
    const w = words[i] as SubtitleWord;
    if (t >= w.start && t <= w.end) {
      activeIndex = i;
      break;
    }
    if (t < w.start && activeIndex === -1) {
      activeIndex = Math.max(0, i - 1);
      break;
    }
  }

  if (activeIndex === -1) {
    // If playhead is after all words or before, clamp
    activeIndex =
      t > (words[words.length - 1]?.end ?? 0) ? words.length - 1 : 0;
  }

  // Group into pages of chunkSize
  const pageIndex = Math.floor(activeIndex / chunkSize);
  const startIdx = pageIndex * chunkSize;
  const endIdx = Math.min(words.length, startIdx + chunkSize);
  const pagedWords = words.slice(startIdx, endIdx);

  return {
    ...cue,
    text: pagedWords.map((w) => w.word).join(" "),
    words: pagedWords,
  };
}
