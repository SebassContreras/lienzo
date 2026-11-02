import { describe, expect, it } from "vitest";
import { voicedSpan } from "./voiced-span.ts";

/**
 * Creates 16-bit PCM samples with silence (amplitude 0) and voice (amplitude > -40 dBFS).
 * Full scale for 16-bit PCM is 32767.
 * -40 dBFS corresponds to amplitude ~ 327.67 (RMS >= 328).
 */
function generatePcm(options: {
  sampleRate: number;
  leadingSilenceSec: number;
  voiceSec: number;
  trailingSilenceSec: number;
  amplitude?: number;
  pauseSec?: number;
}): Int16Array {
  const {
    sampleRate,
    leadingSilenceSec,
    voiceSec,
    trailingSilenceSec,
    amplitude = 10000,
    pauseSec = 0,
  } = options;

  const totalSec =
    leadingSilenceSec + voiceSec + pauseSec + trailingSilenceSec;
  const totalSamples = Math.floor(totalSec * sampleRate);
  const pcm = new Int16Array(totalSamples);

  const startVoice1 = Math.floor(leadingSilenceSec * sampleRate);
  const voice1Sec = pauseSec > 0 ? voiceSec / 2 : voiceSec;
  const endVoice1 = startVoice1 + Math.floor(voice1Sec * sampleRate);

  for (let i = startVoice1; i < endVoice1; i++) {
    pcm[i] = Math.round(amplitude * Math.sin((2 * Math.PI * 440 * i) / sampleRate));
  }

  if (pauseSec > 0) {
    const startVoice2 = endVoice1 + Math.floor(pauseSec * sampleRate);
    const endVoice2 = startVoice2 + Math.floor((voiceSec / 2) * sampleRate);
    for (let i = startVoice2; i < endVoice2; i++) {
      pcm[i] = Math.round(amplitude * Math.sin((2 * Math.PI * 440 * i) / sampleRate));
    }
  }

  return pcm;
}

describe("voicedSpan (R1, D2)", () => {
  const cases = [
    {
      name: "speech from start (speechStart = 0)",
      leadingSilenceSec: 0,
      voiceSec: 1.0,
      trailingSilenceSec: 0.5,
      sampleRate: 24000,
      expectedStart: 0,
      expectedEnd: 1.0,
    },
    {
      name: "leading and trailing silence",
      leadingSilenceSec: 0.4,
      voiceSec: 1.5,
      trailingSilenceSec: 0.6,
      sampleRate: 24000,
      expectedStart: 0.4,
      expectedEnd: 1.9,
    },
    {
      name: "speech ending at final sample (speechEnd = duration)",
      leadingSilenceSec: 0.5,
      voiceSec: 1.0,
      trailingSilenceSec: 0,
      sampleRate: 44100,
      expectedStart: 0.5,
      expectedEnd: 1.5,
    },
    {
      name: "pause inside speech does not split boundary",
      leadingSilenceSec: 0.3,
      voiceSec: 1.0,
      trailingSilenceSec: 0.4,
      pauseSec: 0.1, // 100 ms pause inside speech
      sampleRate: 24000,
      expectedStart: 0.3,
      expectedEnd: 1.4, // 0.3 + 0.5 + 0.1 + 0.5
    },
  ];

  it.each(cases)(
    "$name",
    ({
      leadingSilenceSec,
      voiceSec,
      trailingSilenceSec,
      pauseSec,
      sampleRate,
      expectedStart,
      expectedEnd,
    }) => {
      const pcm = generatePcm({
        sampleRate,
        leadingSilenceSec,
        voiceSec,
        trailingSilenceSec,
        pauseSec,
      });

      const span = voicedSpan(pcm, sampleRate);
      expect(span).not.toBeNull();
      if (!span) return;

      // Invariant: 0 <= speechStart < speechEnd <= duration
      const duration = pcm.length / sampleRate;
      expect(span.start).toBeGreaterThanOrEqual(0);
      expect(span.end).toBeGreaterThan(span.start);
      expect(span.end).toBeLessThanOrEqual(duration + 0.01);

      // Within 10 ms window tolerance (0.01s)
      expect(Math.abs(span.start - expectedStart)).toBeLessThanOrEqual(0.015);
      expect(Math.abs(span.end - expectedEnd)).toBeLessThanOrEqual(0.015);
    },
  );

  it("returns null for all-silent clip", () => {
    const silentPcm = new Int16Array(24000 * 2); // 2 seconds of 0
    expect(voicedSpan(silentPcm, 24000)).toBeNull();
  });

  it("returns null for empty buffer", () => {
    const empty = new Int16Array(0);
    expect(voicedSpan(empty, 24000)).toBeNull();
  });

  it("respects custom thresholdDbfs", () => {
    // Amplitude ~100 is around -50 dBFS, below -40 dBFS default
    const quietPcm = generatePcm({
      sampleRate: 24000,
      leadingSilenceSec: 0.2,
      voiceSec: 0.5,
      trailingSilenceSec: 0.2,
      amplitude: 100,
    });

    expect(voicedSpan(quietPcm, 24000, -40)).toBeNull();
    const relaxed = voicedSpan(quietPcm, 24000, -55);
    expect(relaxed).not.toBeNull();
  });
});
