import { describe, expect, it } from "vitest";
import {
  cuesToTextWithPauses,
  parsePauseDuration,
  parseTextWithPauses,
  wordsToTextWithPauses,
} from "./pauses.ts";

describe("Subtitles Pause Parsing & Gap Detection", () => {
  describe("parsePauseDuration", () => {
    it("recognizes standard pause formats in seconds", () => {
      expect(parsePauseDuration("[0.5s]")).toBe(0.5);
      expect(parsePauseDuration("[1.2]")).toBe(1.2);
      expect(parsePauseDuration("[pause:0.8s]")).toBe(0.8);
      expect(parsePauseDuration("[pause:2]")).toBe(2);
    });

    it("recognizes milliseconds format", () => {
      expect(parsePauseDuration("[p:500ms]")).toBe(0.5);
      expect(parsePauseDuration("[750ms]")).toBe(0.75);
    });

    it("returns null for non-pause tokens", () => {
      expect(parsePauseDuration("hola")).toBeNull();
      expect(parsePauseDuration("[word]")).toBeNull();
      expect(parsePauseDuration("[-1s]")).toBeNull();
    });
  });

  describe("parseTextWithPauses", () => {
    it("generates word timestamps and inserts pause gaps into subsequent words", () => {
      const cues = parseTextWithPauses("Hola [0.8s] mundo", 0, 1.0);
      expect(cues).toHaveLength(1);

      const cue = cues[0];
      expect(cue.text).toBe("Hola mundo"); // Pause token omitted from canvas text
      expect(cue.words).toBeDefined();
      expect(cue.words).toHaveLength(2);

      const words = cue.words ?? [];
      const [w1, w2] = words;
      expect(w1.word).toBe("Hola");
      expect(w1.start).toBe(0);
      expect(w1.end).toBe(0.4);

      // w2 starts after w1.end (0.4) + pause (0.8) = 1.2s
      expect(w2.word).toBe("mundo");
      expect(w2.start).toBe(1.2);
      expect(w2.end).toBe(1.6);
      expect(cue.end).toBe(1.6);
    });

    it("respects start offset and speed factor", () => {
      // 2.0x speed means word duration = 0.2s instead of 0.4s
      const cues = parseTextWithPauses("Hola [0.5s] mundo", 1.0, 2.0);
      const cue = cues[0];
      expect(cue.start).toBe(1.0);

      const words = cue.words ?? [];
      const [w1, w2] = words;
      expect(w1.start).toBe(1.0);
      expect(w1.end).toBe(1.2);

      // w2 starts at 1.2 + 0.5 = 1.7
      expect(w2.start).toBe(1.7);
      expect(w2.end).toBe(1.9);
    });
  });

  describe("wordsToTextWithPauses & cuesToTextWithPauses", () => {
    it("detects gaps between words and serializes them as pause tokens", () => {
      const words = [
        { word: "Hola", start: 0, end: 0.4 },
        { word: "mundo", start: 1.2, end: 1.6 }, // 0.8s gap
      ];

      const serialized = wordsToTextWithPauses(words, 0.2);
      expect(serialized).toBe("Hola [0.8] mundo");
    });

    it("ignores natural micro-gaps below threshold", () => {
      const words = [
        { word: "Hola", start: 0, end: 0.4 },
        { word: "amigos", start: 0.45, end: 0.8 }, // 0.05s gap (< 0.2s)
      ];

      const serialized = wordsToTextWithPauses(words, 0.2);
      expect(serialized).toBe("Hola amigos");
    });

    it("round-trips text with pauses accurately", () => {
      const originalText = "Hola [0.75] amigos míos";
      const parsedCues = parseTextWithPauses(originalText, 0, 1.0);
      const roundTripped = cuesToTextWithPauses(parsedCues, 0.2);

      expect(roundTripped).toBe("Hola [0.75] amigos míos");
    });
  });
});
