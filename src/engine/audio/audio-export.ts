import type { SceneAudio } from "../../model/model.ts";

/**
 * Trims and adjusts an AudioBuffer for video export matching scene duration and offsets.
 * Pure audio processing function (SRP, high cohesion).
 */
export function prepareAudioBufferForExport(
  sourceBuffer: AudioBuffer,
  sceneDuration: number,
  audio: SceneAudio,
): { buffer: AudioBuffer; startOffset: number } | null {
  const startOffset = Math.max(0, audio.startOffset ?? 0);
  const trimOffset = Math.max(0, audio.trimOffset ?? 0);
  const volume = Math.max(0, Math.min(1, audio.volume ?? 1));

  if (startOffset >= sceneDuration) return null;

  const availableAudio = Math.max(0, sourceBuffer.duration - trimOffset);
  if (availableAudio <= 0) return null;

  const durationToPlay = Math.min(sceneDuration - startOffset, availableAudio);
  if (durationToPlay <= 0) return null;

  const sampleRate = sourceBuffer.sampleRate;
  const numChannels = sourceBuffer.numberOfChannels;
  const startSample = Math.floor(trimOffset * sampleRate);
  const totalSamples = Math.floor(durationToPlay * sampleRate);

  if (totalSamples <= 0) return null;

  // Create sliced and volume-adjusted buffer
  const AudioBufferClass =
    typeof AudioBuffer !== "undefined"
      ? AudioBuffer
      : (class MockAudioBuffer {
          length: number;
          numberOfChannels: number;
          sampleRate: number;
          duration: number;
          private channels: Float32Array[];
          constructor(opts: {
            length: number;
            numberOfChannels: number;
            sampleRate: number;
          }) {
            this.length = opts.length;
            this.numberOfChannels = opts.numberOfChannels;
            this.sampleRate = opts.sampleRate;
            this.duration = opts.length / opts.sampleRate;
            this.channels = Array.from(
              { length: opts.numberOfChannels },
              () => new Float32Array(opts.length),
            );
          }
          getChannelData(c: number): Float32Array {
            return this.channels[c] ?? new Float32Array(0);
          }
        } as unknown as typeof AudioBuffer);

  const slicedBuffer = new AudioBufferClass({
    length: totalSamples,
    numberOfChannels: numChannels,
    sampleRate,
  });

  for (let channel = 0; channel < numChannels; channel++) {
    const srcData = sourceBuffer.getChannelData(channel);
    const destData = slicedBuffer.getChannelData(channel);
    for (let i = 0; i < totalSamples; i++) {
      const srcIndex = startSample + i;
      if (srcIndex < srcData.length) {
        destData[i] = (srcData[srcIndex] ?? 0) * volume;
      } else {
        destData[i] = 0;
      }
    }
  }

  return {
    buffer: slicedBuffer,
    startOffset,
  };
}

export type TrackBufferInput = {
  buffer: AudioBuffer;
  volume?: number;
  startOffset?: number;
  trimOffset?: number;
  muted?: boolean;
};

/**
 * Mixes multiple audio track buffers into a single composite AudioBuffer
 * spanning the full scene duration.
 * Pure audio processing function (SRP, high cohesion, testable).
 * Handles:
 * - Independent startOffset and trimOffset per track
 * - Track muting (muted tracks contribute silence)
 * - Volume scaling
 * - Channel expansion (mono to stereo, stereo to stereo)
 * - Soft clipping / clamping to [-1, 1] range
 */
export function mixAudioTracksForExport(
  tracks: TrackBufferInput[],
  sceneDuration: number,
  targetSampleRate = 44100,
): AudioBuffer | null {
  const activeTracks = tracks.filter((t) => !t.muted && (t.volume ?? 1) > 0);
  if (activeTracks.length === 0 || sceneDuration <= 0) {
    return null;
  }

  const sampleRate = targetSampleRate;
  const numChannels = 2; // Stereo output
  const totalSamples = Math.floor(sceneDuration * sampleRate);
  if (totalSamples <= 0) return null;

  const AudioBufferClass =
    typeof AudioBuffer !== "undefined"
      ? AudioBuffer
      : (class MockAudioBuffer {
          length: number;
          numberOfChannels: number;
          sampleRate: number;
          duration: number;
          private channels: Float32Array[];
          constructor(opts: {
            length: number;
            numberOfChannels: number;
            sampleRate: number;
          }) {
            this.length = opts.length;
            this.numberOfChannels = opts.numberOfChannels;
            this.sampleRate = opts.sampleRate;
            this.duration = opts.length / opts.sampleRate;
            this.channels = Array.from(
              { length: opts.numberOfChannels },
              () => new Float32Array(opts.length),
            );
          }
          getChannelData(c: number): Float32Array {
            return this.channels[c] ?? new Float32Array(0);
          }
        } as unknown as typeof AudioBuffer);

  const mixedBuffer = new AudioBufferClass({
    length: totalSamples,
    numberOfChannels: numChannels,
    sampleRate,
  });

  const outLeft = mixedBuffer.getChannelData(0);
  const outRight = mixedBuffer.getChannelData(1);

  for (const track of activeTracks) {
    const vol = Math.max(0, Math.min(1, track.volume ?? 1));
    const startOffset = Math.max(0, track.startOffset ?? 0);
    const trimOffset = Math.max(0, track.trimOffset ?? 0);

    if (startOffset >= sceneDuration) continue;

    const srcBuf = track.buffer;
    const srcRate = srcBuf.sampleRate;
    const srcDuration = srcBuf.duration;
    const available = Math.max(0, srcDuration - trimOffset);
    if (available <= 0) continue;

    const playDuration = Math.min(sceneDuration - startOffset, available);
    const playSamples = Math.floor(playDuration * sampleRate);

    const destStartSample = Math.floor(startOffset * sampleRate);
    const srcStartSample = Math.floor(trimOffset * srcRate);

    const srcChannels = srcBuf.numberOfChannels;
    const srcLeft = srcBuf.getChannelData(0);
    const srcRight = srcChannels > 1 ? srcBuf.getChannelData(1) : srcLeft; // mono duplicated to stereo

    for (let i = 0; i < playSamples; i++) {
      const destIdx = destStartSample + i;
      if (destIdx >= totalSamples) break;

      // Map output index to source index with sampleRate ratio
      const ratio = srcRate / sampleRate;
      const srcIdx = srcStartSample + Math.floor(i * ratio);

      if (srcIdx < srcLeft.length) {
        outLeft[destIdx] += (srcLeft[srcIdx] ?? 0) * vol;
        outRight[destIdx] += (srcRight[srcIdx] ?? 0) * vol;
      }
    }
  }

  // Soft clamp to [-1, 1]
  for (let i = 0; i < totalSamples; i++) {
    outLeft[i] = Math.max(-1, Math.min(1, outLeft[i] ?? 0));
    outRight[i] = Math.max(-1, Math.min(1, outRight[i] ?? 0));
  }

  return mixedBuffer;
}
