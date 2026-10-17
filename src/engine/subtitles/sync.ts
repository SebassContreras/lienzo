import type { SubtitleCue, SubtitleWord } from "./types.ts";

/**
 * Rounds a floating point timestamp in seconds to millisecond precision (3 decimals).
 * Avoids cumulative IEEE 754 precision issues (e.g. 0.10000000000000002).
 */
export function roundToMs(seconds: number): number {
  return Math.round(seconds * 1000) / 1000;
}

/**
 * Immutably scales all cue timings and their inner word timestamps by a speed factor.
 * A speed factor > 1.0 accelerates playback (duration shrinks), while < 1.0 slows it down.
 *
 * @param cues Array of SubtitleCue to scale.
 * @param speedFactor Speed multiplier (e.g. 1.25 for 1.25x faster). Must be > 0.
 * @param originTime Timestamp from which scaling originates (defaults to 0).
 */
export function scaleSubtitleTimings(
  cues: SubtitleCue[],
  speedFactor: number,
  originTime: number = 0,
): SubtitleCue[] {
  if (!cues || cues.length === 0) return [];
  if (speedFactor <= 0) {
    throw new Error("El factor de velocidad debe ser mayor a 0.");
  }

  const scale = 1 / speedFactor;

  return cues.map((cue) => {
    const start = Math.max(
      0,
      roundToMs(originTime + (cue.start - originTime) * scale),
    );
    const rawEnd = originTime + (cue.end - originTime) * scale;
    const end = Math.max(start, roundToMs(rawEnd));

    const words = cue.words?.map((w): SubtitleWord => {
      const wStart = Math.max(
        start,
        roundToMs(originTime + (w.start - originTime) * scale),
      );
      const wEnd = Math.max(
        wStart,
        roundToMs(originTime + (w.end - originTime) * scale),
      );
      return {
        word: w.word,
        start: wStart,
        end: Math.min(end, wEnd),
      };
    });

    return {
      ...cue,
      start,
      end,
      ...(words ? { words } : {}),
    };
  });
}

/**
 * Immutably shifts subtitle cues and their word timestamps by a given offset in seconds.
 * Can shift all cues or only cues from a given index onwards.
 *
 * @param cues Array of SubtitleCue.
 * @param deltaSeconds Positive (delay) or negative (advance) offset in seconds.
 * @param fromCueIndex Starting cue index to shift (defaults to 0 = all cues).
 */
export function shiftSubtitleTimings(
  cues: SubtitleCue[],
  deltaSeconds: number,
  fromCueIndex: number = 0,
): SubtitleCue[] {
  if (!cues || cues.length === 0) return [];
  if (deltaSeconds === 0) return [...cues];

  return cues.map((cue, idx) => {
    if (idx < fromCueIndex) return cue;

    const start = Math.max(0, roundToMs(cue.start + deltaSeconds));
    const duration = roundToMs(cue.end - cue.start);
    const end = roundToMs(start + Math.max(0, duration));

    const words = cue.words?.map((w): SubtitleWord => {
      const wStart = Math.max(0, roundToMs(w.start + deltaSeconds));
      const wDur = roundToMs(w.end - w.start);
      return {
        word: w.word,
        start: wStart,
        end: roundToMs(wStart + Math.max(0, wDur)),
      };
    });

    return {
      ...cue,
      start,
      end,
      ...(words ? { words } : {}),
    };
  });
}

/**
 * Computes the speed factor needed to stretch or compress subtitle cues
 * so their active timespan matches a target audio duration.
 *
 * @param cues Subtitle cues to measure.
 * @param targetDuration Total target duration in seconds (must be > 0).
 * @param startOffset Starting audio offset in seconds (defaults to 0).
 * @returns The speed factor to pass to scaleSubtitleTimings, or 1 if cues have no duration.
 */
export function calculateFitSpeedRatio(
  cues: SubtitleCue[],
  targetDuration: number,
  startOffset: number = 0,
): number {
  if (!cues || cues.length === 0 || targetDuration <= 0) return 1;

  const firstStart = Math.min(...cues.map((c) => c.start));
  const lastEnd = Math.max(...cues.map((c) => c.end));
  const currentDuration = lastEnd - firstStart;

  if (currentDuration <= 0) return 1;

  const availableDuration = targetDuration - startOffset;
  if (availableDuration <= 0) return 1;

  // speedFactor = currentDuration / availableDuration
  // Example: cues are 10s, target audio is 5s -> speedFactor = 10 / 5 = 2.0 (speed up)
  // Example: cues are 5s, target audio is 10s -> speedFactor = 5 / 10 = 0.5 (slow down)
  return roundToMs(currentDuration / availableDuration);
}
