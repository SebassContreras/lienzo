import { describe, expect, it } from "vitest";
import { getActiveCue, isWordActive } from "./cue-timing.ts";
import { layoutSubtitleCue } from "./layout.ts";
import { parseSrt } from "./parsers/srt.ts";
import { extractVttWords, parseVtt } from "./parsers/vtt.ts";
import type { SubtitleCue } from "./types.ts";

describe("Subtitles domain tests", () => {
  const sampleCues: SubtitleCue[] = [
    {
      id: "cue-1",
      start: 0,
      end: 2,
      text: "Hola mundo",
      words: [
        { word: "Hola", start: 0, end: 1 },
        { word: "mundo", start: 1, end: 2 },
      ],
    },
    {
      id: "cue-2",
      start: 2,
      end: 4,
      text: "Segunda frase",
    },
  ];

  it("resolves active cue and active word deterministically at time t", () => {
    // Before first cue
    expect(getActiveCue(sampleCues, -1)).toBeUndefined();

    // In first cue, first word
    const cue1 = getActiveCue(sampleCues, 0.5);
    expect(cue1?.id).toBe("cue-1");
    expect(isWordActive(cue1!.words![0]!, 0.5)).toBe(true);
    expect(isWordActive(cue1!.words![1]!, 0.5)).toBe(false);

    // In first cue, second word
    expect(isWordActive(cue1!.words![0]!, 1.5)).toBe(false);
    expect(isWordActive(cue1!.words![1]!, 1.5)).toBe(true);

    // In second cue
    const cue2 = getActiveCue(sampleCues, 3);
    expect(cue2?.id).toBe("cue-2");

    // After all cues
    expect(getActiveCue(sampleCues, 5)).toBeUndefined();
  });

  it("computes word wrapping layout deterministically", () => {
    const cue: SubtitleCue = {
      start: 0,
      end: 2,
      text: "Uno Dos Tres Cuatro",
      words: [
        { word: "Uno", start: 0, end: 0.5 },
        { word: "Dos", start: 0.5, end: 1 },
        { word: "Tres", start: 1, end: 1.5 },
        { word: "Cuatro", start: 1.5, end: 2 },
      ],
    };

    // Mock measureText: length of string * 10
    const measure = (s: string) => s.length * 10;
    const spaceWidth = 10;
    // Each word is ~3-6 chars (30-60px) + space (10px).
    // maxWidth 90px forces wrapping across multiple lines
    const layout = layoutSubtitleCue(cue, 90, 30, measure, "center");

    expect(layout.lines.length).toBeGreaterThan(1);
    expect(layout.totalHeight).toBe(layout.lines.length * 30);
    expect(layout.lines[0]?.words[0]?.word).toBe("Uno");
  });

  it("parses WebVTT with word karaoke timing tags", () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:03.000
<00:01.000>Hola <00:01.500>mundo <00:02.000>viral
`;
    const parsed = parseVtt(vtt);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.text).toBe("Hola mundo viral");
    expect(parsed[0]?.words).toHaveLength(3);
    expect(parsed[0]?.words?.[0]?.word).toBe("Hola");
    expect(parsed[0]?.words?.[0]?.start).toBeCloseTo(1.0);
    expect(parsed[0]?.words?.[1]?.word).toBe("mundo");
    expect(parsed[0]?.words?.[1]?.start).toBeCloseTo(1.5);
    expect(parsed[0]?.words?.[2]?.word).toBe("viral");
    expect(parsed[0]?.words?.[2]?.start).toBeCloseTo(2.0);
  });

  it("extracts clean text and words when karaoke tags are absent", () => {
    const extracted = extractVttWords("Texto simple sin tags", 0, 5);
    expect(extracted.cleanText).toBe("Texto simple sin tags");
    expect(extracted.words).toBeUndefined();
  });

  it("parses standard SRT accurately", () => {
    const srt = `1
00:00:00,500 --> 00:00:02,500
Subtítulo SRT
`;
    const parsed = parseSrt(srt);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.start).toBeCloseTo(0.5);
    expect(parsed[0]?.end).toBeCloseTo(2.5);
    expect(parsed[0]?.text).toBe("Subtítulo SRT");
  });
});
