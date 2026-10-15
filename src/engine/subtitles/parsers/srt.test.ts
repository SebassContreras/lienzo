import { describe, expect, it } from "vitest";
import { parseSrt, parseSrtTimestamp, srtParser } from "./srt.ts";

describe("parseSrtTimestamp", () => {
  it("parses HH:MM:SS,mmm with comma", () => {
    expect(parseSrtTimestamp("00:01:23,456")).toBeCloseTo(83.456);
  });

  it("parses HH:MM:SS.mmm with dot", () => {
    expect(parseSrtTimestamp("01:00:00.500")).toBeCloseTo(3600.5);
  });

  it("parses MM:SS.mmm", () => {
    expect(parseSrtTimestamp("02:15.200")).toBeCloseTo(135.2);
  });
});

describe("parseSrt", () => {
  it("parses standard multi-cue SRT string", () => {
    const srt = `1
00:00:01,000 --> 00:00:04,000
Hola mundo!

2
00:00:04,500 --> 00:00:07,000
Bienvenidos a Lienzo.
Segunda línea.`;

    const cues = parseSrt(srt);
    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({
      id: "1",
      start: 1,
      end: 4,
      text: "Hola mundo!",
    });
    expect(cues[1]).toEqual({
      id: "2",
      start: 4.5,
      end: 7,
      text: "Bienvenidos a Lienzo. Segunda línea.",
    });
  });

  it("handles UTF-8 BOM and Windows CRLF line breaks", () => {
    const srt =
      "\uFEFF1\r\n00:00:00,100 --> 00:00:02,000\r\nCon BOM y CRLF\r\n";
    const cues = parseSrt(srt);
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe("Con BOM y CRLF");
    expect(cues[0].start).toBeCloseTo(0.1);
    expect(cues[0].end).toBeCloseTo(2.0);
  });

  it("works through SubtitleParser interface", () => {
    const srt = "00:00:00,000 --> 00:00:01,000\nPrueba sin número";
    const cues = srtParser.parse(srt);
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe("Prueba sin número");
  });
});
