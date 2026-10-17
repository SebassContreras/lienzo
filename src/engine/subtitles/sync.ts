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
 * Immutably sets a new starting time for subtitle cues by shifting all cues
 * so that the first cue begins at newStartTime.
 *
 * @param cues Array of SubtitleCue.
 * @param newStartTime Desired start time in seconds (must be >= 0).
 */
export function setSubtitleStartTime(
  cues: SubtitleCue[],
  newStartTime: number,
): SubtitleCue[] {
  if (!cues || cues.length === 0) return [];
  const validStartTime = Math.max(0, roundToMs(newStartTime));
  const currentStart = Math.min(...cues.map((c) => c.start));
  const delta = validStartTime - currentStart;
  if (delta === 0) return [...cues];

  return cues.map((cue) => {
    const start = Math.max(0, roundToMs(cue.start + delta));
    const duration = roundToMs(cue.end - cue.start);
    const end = roundToMs(start + Math.max(0, duration));

    const words = cue.words?.map((w): SubtitleWord => {
      const wStart = Math.max(0, roundToMs(w.start + delta));
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
