import type { SceneAudio } from "../../model/model.ts";

export type AudioPlaybackState =
  | {
      active: false;
    }
  | {
      active: true;
      /** Offset in seconds into the source audio file to start playing from. */
      sourceOffset: number;
      /** Delay in seconds before playing if scene playhead hasn't reached audio startOffset yet. */
      delay: number;
      /** Duration in seconds to play before cutting off (or end of scene loop). */
      duration: number;
    };

export type AudioTimingOptions = {
  /** Scene playhead time t in seconds (0 <= t < sceneDuration). */
  t: number;
  /** Total scene loop duration in seconds. */
  sceneDuration: number;
  /** Scene audio configuration. */
  audio: SceneAudio;
  /** Total duration in seconds of the source audio asset. */
  audioDuration: number;
};

/**
 * Calculates what audio slice to play when the scene is at time `t`.
 * High-cohesion pure function: no Web Audio dependencies, fully deterministic.
 */
export function computeAudioPlayback(
  options: AudioTimingOptions,
): AudioPlaybackState {
  const { t, sceneDuration, audio, audioDuration } = options;
  const startOffset = Math.max(0, audio.startOffset ?? 0);
  const trimOffset = Math.max(0, audio.trimOffset ?? 0);

  // If startOffset is beyond the scene loop duration, it never plays
  if (startOffset >= sceneDuration) {
    return { active: false };
  }

  // Audio available duration from trimOffset
  const availableAudio = Math.max(0, audioDuration - trimOffset);
  if (availableAudio <= 0) {
    return { active: false };
  }

  // Maximum time audio can play in the scene loop: min(sceneDuration - startOffset, availableAudio)
  const maxPlayableDuration = Math.min(sceneDuration - startOffset, availableAudio);
  if (maxPlayableDuration <= 0) {
    return { active: false };
  }

  const audioEndInScene = startOffset + maxPlayableDuration;

  if (t < startOffset) {
    // Playhead is before the audio starts: will start after delay (startOffset - t)
    return {
      active: true,
      sourceOffset: trimOffset,
      delay: startOffset - t,
      duration: maxPlayableDuration,
    };
  }

  if (t >= audioEndInScene) {
    // Playhead is past when audio has finished in this loop cycle
    return { active: false };
  }

  // Playhead is inside the active audio range
  const elapsedSinceStart = t - startOffset;
  return {
    active: true,
    sourceOffset: trimOffset + elapsedSinceStart,
    delay: 0,
    duration: maxPlayableDuration - elapsedSinceStart,
  };
}
