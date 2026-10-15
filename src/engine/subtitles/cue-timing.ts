import type { SubtitleCue, SubtitleWord } from "./types.ts";

/**
 * Finds the currently active subtitle cue at time `t` (in seconds).
 * Returns undefined if no cue is active at time `t`.
 */
export function getActiveCue(cues: SubtitleCue[], t: number): SubtitleCue | undefined {
  if (!cues || cues.length === 0) return undefined;
  for (const cue of cues) {
    if (t >= cue.start && t <= cue.end) {
      return cue;
    }
  }
  return undefined;
}

/**
 * Determines whether a word in a cue is currently active at time `t`.
 */
export function isWordActive(word: SubtitleWord, t: number): boolean {
  return t >= word.start && t <= word.end;
}

/**
 * Determines if a word has already finished playing prior to time `t`.
 */
export function isWordCompleted(word: SubtitleWord, t: number): boolean {
  return t > word.end;
}
