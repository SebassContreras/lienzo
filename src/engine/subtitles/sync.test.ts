import { describe, expect, it } from "vitest";
import {
  roundToMs,
  scaleSubtitleTimings,
  setSubtitleStartTime,
} from "./sync.ts";
import type { SubtitleCue } from "./types.ts";

describe("roundToMs", () => {
  it("rounds seconds to 3 decimal places", () => {
    expect(roundToMs(1.23456)).toBe(1.235);
    expect(roundToMs(0.1 + 0.2)).toBe(0.3);
    expect(roundToMs(2.0001)).toBe(2);
  });
});

describe("scaleSubtitleTimings", () => {
  const sampleCues: SubtitleCue[] = [
    {
      id: "cue-1",
      start: 1,
      end: 3,
      text: "Hola mundo",
      words: [
        { word: "Hola", start: 1, end: 2 },
        { word: "mundo", start: 2, end: 3 },
      ],
    },
    {
      id: "cue-2",
      start: 4,
      end: 6,
      text: "Segunda frase",
      words: [
        { word: "Segunda", start: 4, end: 5 },
        { word: "frase", start: 5, end: 6 },
      ],
    },
  ];

  it("scales cues faster at 2.0x (half duration)", () => {
    const scaled = scaleSubtitleTimings(sampleCues, 2.0);
    expect(scaled[0].start).toBe(0.5);
    expect(scaled[0].end).toBe(1.5);
    expect(scaled[0].words?.[0]).toEqual({ word: "Hola", start: 0.5, end: 1 });
    expect(scaled[0].words?.[1]).toEqual({ word: "mundo", start: 1, end: 1.5 });

    expect(scaled[1].start).toBe(2);
    expect(scaled[1].end).toBe(3);
    expect(scaled[1].words?.[0]).toEqual({
      word: "Segunda",
      start: 2,
      end: 2.5,
    });
  });

  it("scales cues slower at 0.5x (double duration)", () => {
    const scaled = scaleSubtitleTimings(sampleCues, 0.5);
    expect(scaled[0].start).toBe(2);
    expect(scaled[0].end).toBe(6);
    expect(scaled[0].words?.[0]).toEqual({ word: "Hola", start: 2, end: 4 });
  });

  it("scales relative to a specified originTime", () => {
    const scaled = scaleSubtitleTimings(sampleCues, 2.0, 1.0);
    expect(scaled[0].start).toBe(1);
    expect(scaled[0].end).toBe(2);
  });

  it("throws error for non-positive speedFactor", () => {
    expect(() => scaleSubtitleTimings(sampleCues, 0)).toThrow();
    expect(() => scaleSubtitleTimings(sampleCues, -1)).toThrow();
  });

  it("handles empty array cleanly", () => {
    expect(scaleSubtitleTimings([], 1.5)).toEqual([]);
  });
});

describe("setSubtitleStartTime", () => {
  const sampleCues: SubtitleCue[] = [
    {
      id: "cue-1",
      start: 1,
      end: 2,
      text: "Uno",
      words: [{ word: "Uno", start: 1, end: 2 }],
    },
    {
      id: "cue-2",
      start: 3,
      end: 4.5,
      text: "Dos",
      words: [{ word: "Dos", start: 3, end: 4.5 }],
    },
  ];

  it("moves start time to a later timestamp", () => {
    const shifted = setSubtitleStartTime(sampleCues, 2.5);
    expect(shifted[0].start).toBe(2.5);
    expect(shifted[0].end).toBe(3.5);
    expect(shifted[0].words?.[0].start).toBe(2.5);
    expect(shifted[0].words?.[0].end).toBe(3.5);

    expect(shifted[1].start).toBe(4.5);
    expect(shifted[1].end).toBe(6);
  });

  it("moves start time to 0", () => {
    const shifted = setSubtitleStartTime(sampleCues, 0);
    expect(shifted[0].start).toBe(0);
    expect(shifted[0].end).toBe(1);
    expect(shifted[1].start).toBe(2);
    expect(shifted[1].end).toBe(3.5);
  });

  it("handles empty array cleanly", () => {
    expect(setSubtitleStartTime([], 2)).toEqual([]);
  });
});
