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
        destData[i] = srcData[srcIndex]! * volume;
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
