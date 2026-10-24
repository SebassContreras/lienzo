import { createElement } from "../../components/index.ts";
import type { SubtitlesEl } from "../../components/subtitles/descriptor.ts";
import {
  createAudioTrack,
  getSceneAudioTracks,
} from "../../engine/audio/audio-tracks.ts";
import type { SubtitleCue } from "../../engine/subtitles/types.ts";
import type { Scene } from "../../model/model.ts";

export interface AttachSpeechOptions {
  /** The asset ID or URL where the generated audio is stored. */
  assetId: string;
  /** The measured or estimated duration of the audio in seconds. */
  audioDuration: number;
  /** Volume 0..1 (default: 1.0). */
  volume?: number;
  /** Start offset in seconds relative to scene timeline (default: 0). */
  startOffset?: number;
  /** Whether to adjust scene.duration to match speech length (default: true). */
  adjustSceneDuration?: boolean;
  /** Optional generated subtitle cues to attach to a subtitles element. */
  cues?: SubtitleCue[];
  /**
   * Append the clip as a new `audioTracks` entry, keeping `scene.audio` and the other
   * tracks, and append its cues instead of replacing them (060/D1). Default: false.
   */
  asTrack?: boolean;
}

/**
 * Existing cues outside the new clip's window, plus the new ones, by start time; a
 * re-run for the same shot replaces its cues instead of duplicating them (060/D1).
 */
function mergeCues(
  existing: SubtitleCue[],
  added: SubtitleCue[],
  from: number,
  to: number,
): SubtitleCue[] {
  const kept = existing.filter((c) => c.start < from || c.start >= to);
  return [...kept, ...added].sort((a, b) => a.start - b.start);
}

/**
 * Pure function that attaches speech audio to a scene (D3, R4, R5).
 * Updates `scene.audio`, optionally adjusts `scene.duration`, and creates/updates
 * a `subtitles` component if cues are supplied.
 * Implements Principle 1 (SRP) and Principle 5 (Pure function).
 */
export function attachSpeechToScene(
  scene: Scene,
  options: AttachSpeechOptions,
): Scene {
  const {
    assetId,
    audioDuration,
    volume = 1.0,
    startOffset = 0,
    adjustSceneDuration = true,
    cues,
    asTrack = false,
  } = options;

  let newDuration = scene.duration;
  if (adjustSceneDuration && audioDuration > 0) {
    const requiredDuration =
      Math.round((startOffset + audioDuration + 0.2) * 10) / 10;
    newDuration = Math.max(scene.duration, requiredDuration);
  }

  // Playback ignores `scene.audio` once `audioTracks` has entries, so a legacy single
  // track is carried into the list by `getSceneAudioTracks` before appending.
  const audio = asTrack ? scene.audio : { assetId, volume, startOffset };
  const audioTracks = asTrack
    ? [
        ...getSceneAudioTracks(scene),
        createAudioTrack(assetId, { name: "Voz", volume, startOffset }),
      ]
    : scene.audioTracks;

  const updatedElements = [...scene.elements];

  // If cues are provided, update existing subtitles element or create a new one
  if (cues && cues.length > 0) {
    const existingIndex = updatedElements.findIndex(
      (el) => el.kind === "subtitles",
    );

    if (existingIndex >= 0) {
      const existing = updatedElements[existingIndex] as SubtitlesEl;
      const updatedSubtitles: SubtitlesEl = {
        ...existing,
        cues: asTrack
          ? mergeCues(
              existing.cues ?? [],
              cues,
              startOffset,
              startOffset + audioDuration,
            )
          : cues,
      };
      updatedElements[existingIndex] = updatedSubtitles;
    } else {
      const newSubtitles = createElement("subtitles");
      newSubtitles.cues = cues;
      // Position subtitle near the bottom-center of the scene
      newSubtitles.x = Math.round((scene.width - newSubtitles.w) / 2);
      newSubtitles.y = Math.round(scene.height - newSubtitles.h - 40);
      updatedElements.push(newSubtitles);
    }
  }

  return {
    ...scene,
    duration: newDuration,
    audio,
    audioTracks,
    elements: updatedElements,
  };
}
