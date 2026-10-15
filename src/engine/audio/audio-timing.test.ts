import { describe, expect, it } from "vitest";
import { computeAudioPlayback } from "./audio-timing.ts";

describe("computeAudioPlayback", () => {
  it("returns inactive if startOffset is beyond scene duration", () => {
    const res = computeAudioPlayback({
      t: 1,
      sceneDuration: 5,
      audioDuration: 10,
      audio: { assetId: "a", startOffset: 6 },
    });
    expect(res).toEqual({ active: false });
  });

  it("returns inactive if trimOffset exceeds audioDuration", () => {
    const res = computeAudioPlayback({
      t: 1,
      sceneDuration: 5,
      audioDuration: 4,
      audio: { assetId: "a", trimOffset: 5 },
    });
    expect(res).toEqual({ active: false });
  });

  it("schedules delayed start when t is before startOffset", () => {
    const res = computeAudioPlayback({
      t: 1,
      sceneDuration: 6,
      audioDuration: 10,
      audio: { assetId: "a", startOffset: 2.5, trimOffset: 1 },
    });
    expect(res).toEqual({
      active: true,
      sourceOffset: 1,
      delay: 1.5,
      duration: 3.5, // min(6 - 2.5 = 3.5, 10 - 1 = 9)
    });
  });

  it("computes correct sourceOffset and duration when t is in middle of audio", () => {
    const res = computeAudioPlayback({
      t: 3,
      sceneDuration: 6,
      audioDuration: 10,
      audio: { assetId: "a", startOffset: 2, trimOffset: 1 },
    });
    expect(res).toEqual({
      active: true,
      sourceOffset: 2, // trimOffset (1) + (t - startOffset) (1)
      delay: 0,
      duration: 3, // maxPlayable (4) - 1
    });
  });

  it("returns inactive when t is past audio end in scene", () => {
    const res = computeAudioPlayback({
      t: 4.5,
      sceneDuration: 6,
      audioDuration: 2, // 2s of audio starting at 1s ends at 3s
      audio: { assetId: "a", startOffset: 1, trimOffset: 0 },
    });
    expect(res).toEqual({ active: false });
  });
});
