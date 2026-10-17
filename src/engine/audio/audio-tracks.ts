import type { AudioTrackItem, Scene } from "../../model/model.ts";

/**
 * Normalizes audio tracks from a scene into a consistent AudioTrackItem array.
 * If scene.audioTracks is provided and non-empty, returns it.
 * Otherwise, falls back to legacy single-track scene.audio if present.
 * Pure function: high cohesion, deterministic, no side effects.
 */
export function getSceneAudioTracks(scene: Partial<Scene>): AudioTrackItem[] {
  if (scene.audioTracks && scene.audioTracks.length > 0) {
    return scene.audioTracks;
  }
  if (scene.audio?.assetId) {
    return [
      {
        id: "legacy-track",
        assetId: scene.audio.assetId,
        name: "Audio principal",
        volume: scene.audio.volume ?? 1,
        startOffset: scene.audio.startOffset ?? 0,
        trimOffset: scene.audio.trimOffset ?? 0,
        muted: false,
      },
    ];
  }
  return [];
}

/**
 * Creates a fresh default AudioTrackItem with standard fallback values.
 */
export function createAudioTrack(
  assetId: string,
  options?: Partial<Omit<AudioTrackItem, "id" | "assetId">>,
): AudioTrackItem {
  return {
    id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    assetId,
    name: options?.name ?? "Pista de audio",
    volume: options?.volume ?? 1,
    startOffset: options?.startOffset ?? 0,
    trimOffset: options?.trimOffset ?? 0,
    muted: options?.muted ?? false,
  };
}
