import { round2 } from "../core/round.ts";

export interface VoicedSpan {
  start: number;
  end: number;
}

/**
 * Pure function that calculates the voiced span (first and last audible instant)
 * from 16-bit PCM samples using RMS windows (D2, R1).
 *
 * Full scale for 16-bit signed PCM is 32767.
 * Default threshold is -40 dBFS.
 * Default window is 10 ms.
 */
export function voicedSpan(
  samples: Int16Array,
  sampleRate: number,
  thresholdDbfs = -40,
  windowMs = 10,
): VoicedSpan | null {
  if (!samples || samples.length === 0 || sampleRate <= 0) {
    return null;
  }

  const windowSamples = Math.max(1, Math.floor(sampleRate * (windowMs / 1000)));
  const numWindows = Math.floor(samples.length / windowSamples);
  if (numWindows === 0) {
    return null;
  }

  // threshold in linear RMS ratio: 10^(dBFS / 20)
  // e.g. -40 dBFS = 0.01 of full scale (327.67)
  const linearThreshold = Math.pow(10, thresholdDbfs / 20);
  const fullScale = 32767;
  const rmsThreshold = linearThreshold * fullScale;

  let firstWindowIndex = -1;
  let lastWindowIndex = -1;

  for (let w = 0; w < numWindows; w++) {
    const offset = w * windowSamples;
    let sumSquares = 0;
    for (let i = 0; i < windowSamples; i++) {
      const val = samples[offset + i];
      sumSquares += val * val;
    }
    const rms = Math.sqrt(sumSquares / windowSamples);
    if (rms >= rmsThreshold) {
      if (firstWindowIndex === -1) {
        firstWindowIndex = w;
      }
      lastWindowIndex = w;
    }
  }

  if (firstWindowIndex === -1 || lastWindowIndex === -1) {
    return null;
  }

  const startSec = round2((firstWindowIndex * windowSamples) / sampleRate);
  const endSec = round2(((lastWindowIndex + 1) * windowSamples) / sampleRate);

  return {
    start: startSec,
    end: endSec,
  };
}
