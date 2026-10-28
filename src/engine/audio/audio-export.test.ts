import { describe, expect, it } from "vitest";
import { mixAudioTracksForExport } from "./audio-export.ts";

function createMockAudioBuffer(opts: {
  sampleRate: number;
  duration: number;
  numberOfChannels: number;
  fillValue?: number;
}): AudioBuffer {
  const length = Math.floor(opts.sampleRate * opts.duration);
  const channels = Array.from({ length: opts.numberOfChannels }, () =>
    new Float32Array(length).fill(opts.fillValue ?? 0.5),
  );
  return {
    sampleRate: opts.sampleRate,
    duration: opts.duration,
    length,
    numberOfChannels: opts.numberOfChannels,
    getChannelData: (c: number) => channels[c] ?? new Float32Array(0),
  } as unknown as AudioBuffer;
}

describe("mixAudioTracksForExport", () => {
  it("returns null when tracks array is empty or all muted", () => {
    expect(mixAudioTracksForExport([], 5)).toBeNull();

    const mutedTrack = {
      buffer: createMockAudioBuffer({
        sampleRate: 44100,
        duration: 3,
        numberOfChannels: 1,
      }),
      muted: true,
    };
    expect(mixAudioTracksForExport([mutedTrack], 5)).toBeNull();
  });

  it("mixes two active tracks and produces stereo composite buffer", () => {
    const track1 = {
      buffer: createMockAudioBuffer({
        sampleRate: 44100,
        duration: 3,
        numberOfChannels: 1,
        fillValue: 0.2,
      }),
      volume: 1,
      startOffset: 0,
      trimOffset: 0,
      muted: false,
    };

    const track2 = {
      buffer: createMockAudioBuffer({
        sampleRate: 44100,
        duration: 2,
        numberOfChannels: 1,
        fillValue: 0.3,
      }),
      volume: 1,
      startOffset: 1,
      trimOffset: 0,
      muted: false,
    };

    const mixed = mixAudioTracksForExport([track1, track2], 4, 44100);
    expect(mixed).not.toBeNull();
    if (!mixed) return;

    expect(mixed.numberOfChannels).toBe(2);
    expect(mixed.sampleRate).toBe(44100);
    expect(mixed.duration).toBe(4);

    const left = mixed.getChannelData(0);
    const right = mixed.getChannelData(1);

    // At t=0.5s: only track1 is playing (0.2)
    const idxEarly = Math.floor(0.5 * 44100);
    expect(left[idxEarly]).toBeCloseTo(0.2, 2);
    expect(right[idxEarly]).toBeCloseTo(0.2, 2);

    // At t=1.5s: both track1 (0.2) and track2 (0.3) are playing -> 0.5
    const idxMid = Math.floor(1.5 * 44100);
    expect(left[idxMid]).toBeCloseTo(0.5, 2);
    expect(right[idxMid]).toBeCloseTo(0.5, 2);

    // At t=3.5s: track1 (duration 3s) and track2 (1s to 3s) ended -> 0
    const idxLate = Math.floor(3.5 * 44100);
    expect(left[idxLate]).toBeCloseTo(0, 2);
    expect(right[idxLate]).toBeCloseTo(0, 2);
  });

  it("applies soft clamping on audio clipping > 1", () => {
    const loud1 = {
      buffer: createMockAudioBuffer({
        sampleRate: 44100,
        duration: 2,
        numberOfChannels: 1,
        fillValue: 0.8,
      }),
      volume: 1,
      startOffset: 0,
    };
    const loud2 = {
      buffer: createMockAudioBuffer({
        sampleRate: 44100,
        duration: 2,
        numberOfChannels: 1,
        fillValue: 0.8,
      }),
      volume: 1,
      startOffset: 0,
    };

    const mixed = mixAudioTracksForExport([loud1, loud2], 2, 44100);
    expect(mixed).not.toBeNull();
    if (!mixed) return;

    const left = mixed.getChannelData(0);
    expect(left[100]).toBe(1.0); // clamped at 1.0
  });

  it("respects trimOffset", () => {
    const buf = createMockAudioBuffer({
      sampleRate: 44100,
      duration: 3,
      numberOfChannels: 1,
      fillValue: 0.4,
    });
    // Write varying data
    const data = buf.getChannelData(0);
    for (let i = 0; i < 44100; i++) data[i] = 0.1; // first second
    for (let i = 44100; i < data.length; i++) data[i] = 0.9; // rest

    const track = {
      buffer: buf,
      trimOffset: 1.0, // skip the 0.1 section
      startOffset: 0,
    };

    const mixed = mixAudioTracksForExport([track], 2, 44100);
    expect(mixed).not.toBeNull();
    if (!mixed) return;

    const left = mixed.getChannelData(0);
    expect(left[100]).toBeCloseTo(0.9, 2);
  });
});
