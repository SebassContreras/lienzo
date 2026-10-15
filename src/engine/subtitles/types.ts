/**
 * Subtitle domain types and models.
 * Pure types representing timed captions and word-level karaoke timestamps.
 */

export interface SubtitleWord {
  /** The word text. */
  word: string;
  /** Start time in seconds relative to scene timeline. */
  start: number;
  /** End time in seconds relative to scene timeline. */
  end: number;
}

export interface SubtitleCue {
  /** Unique identifier for the cue (e.g. index or generated id). */
  id?: string;
  /** Start time in seconds relative to scene timeline. */
  start: number;
  /** End time in seconds relative to scene timeline. */
  end: number;
  /** Full cue text. */
  text: string;
  /** Optional word-level breakdown for karaoke timing. */
  words?: SubtitleWord[];
}

/**
 * Standard interface for subtitle parsers.
 */
export interface SubtitleParser {
  /** Parse raw subtitle content into an array of SubtitleCues. */
  parse(content: string): SubtitleCue[];
}
