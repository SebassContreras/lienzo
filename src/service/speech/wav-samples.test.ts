import { describe, expect, it } from "vitest";
import { readWavSamples } from "./wav-samples.ts";

describe("readWavSamples", () => {
  it("extracts 16-bit PCM samples and sampleRate correctly", () => {
    const sampleRate = 24000;
    const numSamples = 240; // 10ms
    const buffer = new Uint8Array(44 + numSamples * 2);
    const view = new DataView(buffer.buffer);

    buffer.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
    view.setUint32(4, 36 + numSamples * 2, true);
    buffer.set([0x57, 0x41, 0x56, 0x45], 8); // WAVE

    buffer.set([0x66, 0x6d, 0x74, 0x20], 12); // fmt
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true); // 16-bit

    buffer.set([0x64, 0x61, 0x74, 0x61], 36); // data
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      view.setInt16(44 + i * 2, i * 100, true);
    }

    const res = readWavSamples(buffer);
    expect(res).toBeDefined();
    expect(res?.sampleRate).toBe(24000);
    expect(res?.samples.length).toBe(numSamples);
    expect(res?.samples[10]).toBe(1000);
  });

  it("returns undefined for non-WAV buffer", () => {
    expect(readWavSamples(new Uint8Array([1, 2, 3, 4]))).toBeUndefined();
  });

  it("returns undefined for non-PCM WAV", () => {
    const buffer = new Uint8Array(44);
    const view = new DataView(buffer.buffer);
    buffer.set([0x52, 0x49, 0x46, 0x46], 0);
    buffer.set([0x57, 0x41, 0x56, 0x45], 8);
    buffer.set([0x66, 0x6d, 0x74, 0x20], 12);
    view.setUint32(16, 16, true);
    view.setUint16(20, 6, true); // A-law / non-PCM
    view.setUint16(22, 1, true);
    view.setUint32(24, 24000, true);
    view.setUint16(34, 8, true);
    buffer.set([0x64, 0x61, 0x74, 0x61], 36);
    view.setUint32(40, 0, true);

    expect(readWavSamples(buffer)).toBeUndefined();
  });
});
