import type { SceneAudio } from "../../model/model.ts";
import { computeAudioPlayback } from "./audio-timing.ts";

/**
 * Interface for audio playback.
 * Follows Service Layer / Dependency Inversion (SRP, swappable for testing).
 */
export interface IAudioPlayer {
  sync(t: number, playing: boolean, sceneDuration: number, audio?: SceneAudio): void;
  pause(): void;
  dispose(): void;
}

/**
 * Web Audio API implementation of AudioPlayer.
 * Reuses an AudioContext and handles decoding, caching, and synchronized playback.
 */
export class WebAudioPlayer implements IAudioPlayer {
  private ctx: AudioContext | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private activeSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private currentAssetId: string | null = null;
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

  sync(
    t: number,
    playing: boolean,
    sceneDuration: number,
    audio?: SceneAudio,
  ): void {
    if (!audio || !audio.assetId) {
      this.pause();
      this.currentAssetId = null;
      return;
    }

    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Preload buffer if not loaded
    if (!this.bufferCache.has(audio.assetId)) {
      this.loadBuffer(audio.assetId).then((buf) => {
        if (buf && this.isPlaying) {
          // Trigger re-sync once loaded
          this.sync(this.lastT, this.isPlaying, sceneDuration, audio);
        }
      });
    }

    const buffer = this.bufferCache.get(audio.assetId);
    if (!buffer) {
      this.lastT = t;
      this.isPlaying = playing;
      return;
    }

    // Set volume via GainNode
    const volume = Math.max(0, Math.min(1, audio.volume ?? 1));
    if (!this.gainNode) {
      this.gainNode = ctx.createGain();
      this.gainNode.connect(ctx.destination);
    }
    this.gainNode.gain.setValueAtTime(volume, ctx.currentTime);

    if (!playing) {
      this.pause();
      this.lastT = t;
      this.isPlaying = false;
      return;
    }

    // Check if loop wrapped around or seek occurred
    const loopJumped = this.isPlaying && t < this.lastT - 0.1;
    const playStateChanged = !this.isPlaying;
    this.lastT = t;
    this.isPlaying = true;

    if (playStateChanged || loopJumped || !this.activeSource) {
      this.stopSource();
      const timing = computeAudioPlayback({
        t,
        sceneDuration,
        audio,
        audioDuration: buffer.duration,
      });

      if (!timing.active) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.gainNode);

      const startTime = ctx.currentTime + timing.delay;
      source.start(startTime, timing.sourceOffset, timing.duration);
      this.activeSource = source;
    }
  }

  private stopSource(): void {
    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch {
        // already stopped
      }
      this.activeSource = null;
    }
  }

  pause(): void {
    this.stopSource();
    this.isPlaying = false;
  }

  dispose(): void {
    this.stopSource();
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.bufferCache.clear();
  }
}
