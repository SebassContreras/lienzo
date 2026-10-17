import type { AudioTrackItem, Scene, SceneAudio } from "../../model/model.ts";
import { computeAudioPlayback } from "./audio-timing.ts";
import { getSceneAudioTracks } from "./audio-tracks.ts";

/**
 * Interface for audio playback.
 * Follows Service Layer / Dependency Inversion (SRP, swappable for testing).
 */
export interface IAudioPlayer {
  sync(
    t: number,
    playing: boolean,
    sceneDuration: number,
    audio?: SceneAudio,
    audioTracks?: AudioTrackItem[],
  ): void;
  syncScene(t: number, playing: boolean, scene: Partial<Scene>): void;
  pause(): void;
  dispose(): void;
}

type ActiveTrackState = {
  source: AudioBufferSourceNode | null;
  gainNode: GainNode;
  lastVolume: number;
};

/**
 * Web Audio API implementation of multi-track AudioPlayer.
 * Reuses an AudioContext and handles decoding, caching, and synchronized playback
 * for multiple simultaneous audio tracks.
 */
export class WebAudioPlayer implements IAudioPlayer {
  private ctx: AudioContext | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private tracks = new Map<string, ActiveTrackState>();
  private isPlaying = false;
  private lastT = -1;

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private async loadBuffer(assetId: string): Promise<AudioBuffer | null> {
    const cached = this.bufferCache.get(assetId);
    if (cached) return cached;

    const ctx = this.getAudioContext();
    if (!ctx) return null;

    try {
      const res = await fetch(assetId);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(assetId, decoded);
      return decoded;
    } catch {
      return null;
    }
  }

  syncScene(t: number, playing: boolean, scene: Partial<Scene>): void {
    const tracks = getSceneAudioTracks(scene);
    this.sync(t, playing, scene.duration ?? 5, scene.audio, tracks);
  }

  sync(
    t: number,
    playing: boolean,
    sceneDuration: number,
    audio?: SceneAudio,
    audioTracks?: AudioTrackItem[],
  ): void {
    const activeTracks =
      audioTracks && audioTracks.length > 0
        ? audioTracks
        : getSceneAudioTracks({ audio, audioTracks });

    if (activeTracks.length === 0) {
      this.pause();
      return;
    }

    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Check if loop wrapped around or seek occurred
    const loopJumped = this.isPlaying && t < this.lastT - 0.1;
    const playStateChanged = !this.isPlaying && playing;
    this.lastT = t;
    this.isPlaying = playing;

    if (!playing) {
      this.stopAllSources();
      return;
    }

    // Identify which track IDs should remain active
    const currentTrackIds = new Set(activeTracks.map((tr) => tr.id));

    // Remove any track state that was deleted from the scene
    for (const [id, state] of this.tracks.entries()) {
      if (!currentTrackIds.has(id)) {
        this.stopTrackSource(state);
        state.gainNode.disconnect();
        this.tracks.delete(id);
      }
    }

    for (const track of activeTracks) {
      if (track.muted || (track.volume ?? 1) <= 0) {
        const state = this.tracks.get(track.id);
        if (state) {
          this.stopTrackSource(state);
        }
        continue;
      }

      // Preload buffer if not loaded
      if (!this.bufferCache.has(track.assetId)) {
        this.loadBuffer(track.assetId).then((buf) => {
          if (buf && this.isPlaying) {
            this.sync(
              this.lastT,
              this.isPlaying,
              sceneDuration,
              audio,
              audioTracks,
            );
          }
        });
      }

      const buffer = this.bufferCache.get(track.assetId);
      if (!buffer) continue;

      let state = this.tracks.get(track.id);
      if (!state) {
        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        state = {
          source: null,
          gainNode,
          lastVolume: -1,
        };
        this.tracks.set(track.id, state);
      }

      const volume = Math.max(0, Math.min(1, track.volume ?? 1));
      if (state.lastVolume !== volume) {
        state.gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        state.lastVolume = volume;
      }

      if (playStateChanged || loopJumped || !state.source) {
        this.stopTrackSource(state);

        const timing = computeAudioPlayback({
          t,
          sceneDuration,
          audio: {
            assetId: track.assetId,
            volume: track.volume,
            startOffset: track.startOffset,
            trimOffset: track.trimOffset,
          },
          audioDuration: buffer.duration,
        });

        if (!timing.active) continue;

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(state.gainNode);

        const startTime = ctx.currentTime + timing.delay;
        source.start(startTime, timing.sourceOffset, timing.duration);
        state.source = source;
      }
    }
  }

  private stopTrackSource(state: ActiveTrackState): void {
    if (state.source) {
      try {
        state.source.stop();
        state.source.disconnect();
      } catch {
        // already stopped
      }
      state.source = null;
    }
  }

  private stopAllSources(): void {
    for (const state of this.tracks.values()) {
      this.stopTrackSource(state);
    }
  }

  pause(): void {
    this.stopAllSources();
    this.isPlaying = false;
  }

  dispose(): void {
    this.stopAllSources();
    for (const state of this.tracks.values()) {
      state.gainNode.disconnect();
    }
    this.tracks.clear();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.bufferCache.clear();
  }
}
