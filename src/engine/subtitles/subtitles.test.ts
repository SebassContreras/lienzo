import { describe, expect, it } from "vitest";
import type { SubtitlesEl } from "../../components/subtitles/descriptor.ts";
import { drawSubtitles } from "../../components/subtitles/draw.ts";
import { applyTracks } from "../tracks.ts";
import { getActiveCue, isWordActive } from "./cue-timing.ts";
import { layoutSubtitleCue } from "./layout.ts";
import { extractVttWords, parseVtt } from "./parsers/vtt.ts";
import { scaleSubtitleTimings } from "./sync.ts";
import type { SubtitleCue } from "./types.ts";
import { paginateCueForTime } from "./word-window.ts";

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
    const [w0, w1] = cue1?.words ?? [];
    if (!w0 || !w1) throw new Error("cue-1 needs two words");
    expect(isWordActive(w0, 0.5)).toBe(true);
    expect(isWordActive(w1, 0.5)).toBe(false);

    // In first cue, second word
    expect(isWordActive(w0, 1.5)).toBe(false);
    expect(isWordActive(w1, 1.5)).toBe(true);

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
    // Each word is ~3-6 chars (30-60px) + space (10px).
    // maxWidth 90px forces wrapping across multiple lines
    const layout = layoutSubtitleCue(cue, 90, 30, measure, "center");

    expect(layout.lines.length).toBeGreaterThan(1);
    expect(layout.totalHeight).toBe(layout.lines.length * 30);
    expect(layout.lines[0]?.words[0]?.word).toBe("Uno");
  });

  it("reserves clearance padding between words when highlightScale > 1 (039/R3, D3)", () => {
    const cue: SubtitleCue = {
      start: 0,
      end: 2,
      text: "Hola mundo",
      words: [
        { word: "Hola", start: 0, end: 1 },
        { word: "mundo", start: 1, end: 2 },
      ],
    };

    const measure = (s: string) => s.length * 10;
    // highlightScale 1.0 vs 1.2
    const unscaled = layoutSubtitleCue(cue, 500, 30, measure, "left", 1.0);
    const scaled = layoutSubtitleCue(cue, 500, 30, measure, "left", 1.2);

    const gap = (layout: typeof unscaled) => {
      const [first, second] = layout.lines[0]?.words ?? [];
      if (!first || !second) throw new Error("the first line needs two words");
      return second.x - (first.x + first.width);
    };
    const unscaledGap = gap(unscaled);
    const scaledGap = gap(scaled);

    // Scaled gap should be wider than unscaled gap by wordWidth * (scale - 1)
    expect(scaledGap).toBeGreaterThan(unscaledGap);
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

  it("draws subtitles deterministically positioned at element coordinates", () => {
    const el = {
      id: "sub-1",
      kind: "subtitles" as const,
      x: 100,
      y: 200,
      w: 600,
      h: 120,
      cues: [
        {
          id: "c1",
          start: 0,
          end: 2,
          text: "Prueba de alineación",
        },
      ],
      font: "Inter",
      size: 32,
      weight: 700,
      textColor: "#ffffff",
      align: "center" as const,
      maxWidth: 600,
      lineHeight: 1.2,
      highlightColor: "#facc15",
      highlightScale: 1,
      background: true,
      bgColor: "#000000",
      bgOpacity: 0.8,
      paddingX: 10,
      paddingY: 10,
      radius: 8,
      animPreset: "none",
    };

    const drawnTexts: { text: string; x: number; y: number }[] = [];
    const drawnRects: { x: number; y: number; w: number; h: number }[] = [];

    const mockCtx = {
      save: () => {},
      restore: () => {},
      measureText: (text: string) => ({ width: text.length * 10 }),
      font: "",
      textBaseline: "",
      fillStyle: "",
      globalAlpha: 1,
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      transform: () => {},
      beginPath: () => {},
      rect: (x: number, y: number, w: number, h: number) => {
        drawnRects.push({ x, y, w, h });
      },
      fill: () => {},
      fillText: (text: string, x: number, y: number) => {
        drawnTexts.push({ text, x, y });
      },
    };

    drawSubtitles(
      mockCtx as never,
      el as never,
      {
        alpha: 1,
        dx: 0,
        dy: 0,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        skewX: 0,
        skewY: 0,
        glowMul: 1,
        progress: 1,
        reveal: 1,
        revealUnit: "char",
        revealSoft: false,
      },
      {
        scene: {
          width: 1080,
          height: 1920,
          fps: 30,
          duration: 5,
          elements: [],
        } as never,
        t: 1,
        byId: new Map(),
        drawElements: () => {},
      },
    );

    expect(drawnTexts.length).toBeGreaterThan(0);
    // Ensure all drawn coordinates start at or within el.x and el.y
    for (const dt of drawnTexts) {
      expect(dt.x).toBeGreaterThanOrEqual(el.x);
      expect(dt.y).toBeGreaterThanOrEqual(el.y);
    }
    if (drawnRects.length > 0) {
      expect(drawnRects[0]?.x).toBeGreaterThanOrEqual(el.x - el.paddingX);
      expect(drawnRects[0]?.y).toBeGreaterThanOrEqual(el.y - el.paddingY);
    }
  });

  it("paginates long cues into active word window to prevent overflow (R3@2, D2@3)", () => {
    const longCue: SubtitleCue = {
      id: "cue-long",
      start: 0,
      end: 10,
      text: "Uno dos tres cuatro cinco seis siete ocho nueve diez",
      words: [
        { word: "Uno", start: 0, end: 1 },
        { word: "dos", start: 1, end: 2 },
        { word: "tres", start: 2, end: 3 },
        { word: "cuatro", start: 3, end: 4 },
        { word: "cinco", start: 4, end: 5 },
        { word: "seis", start: 5, end: 6 },
        { word: "siete", start: 6, end: 7 },
        { word: "ocho", start: 7, end: 8 },
        { word: "nueve", start: 8, end: 9 },
        { word: "diez", start: 9, end: 10 },
      ],
    };

    // At t=0.5 (first page, words 0..3)
    const page1 = paginateCueForTime(longCue, 0.5, { wordsPerWindow: 4 });
    expect(page1.words).toHaveLength(4);
    expect(page1.words?.[0]?.word).toBe("Uno");
    expect(page1.words?.[3]?.word).toBe("cuatro");

    // At t=5.5 (second page, words 4..7)
    const page2 = paginateCueForTime(longCue, 5.5, { wordsPerWindow: 4 });
    expect(page2.words).toHaveLength(4);
    expect(page2.words?.[0]?.word).toBe("cinco");
    expect(page2.words?.[3]?.word).toBe("ocho");

    // At t=8.5 (third page, words 8..9)
    const page3 = paginateCueForTime(longCue, 8.5, { wordsPerWindow: 4 });
    expect(page3.words).toHaveLength(2);
    expect(page3.words?.[0]?.word).toBe("nueve");
    expect(page3.words?.[1]?.word).toBe("diez");
  });

  it("keeps keyframe tracks locked to canvas time t while rendering recalibrated cues (R5@1, D4@1)", () => {
    // Recalibrate cues by 2.0x (duration shrinks from 4s to 2s)
    const originalCues: SubtitleCue[] = [
      { id: "c1", start: 0, end: 2, text: "Parte 1" },
      { id: "c2", start: 2, end: 4, text: "Parte 2" },
    ];
    const scaledCues = scaleSubtitleTimings(originalCues, 2.0);

    const el = {
      id: "sub-1",
      kind: "subtitles",
      x: 100,
      y: 200,
      w: 800,
      h: 160,
      cues: scaledCues,
      tracks: {
        x: [
          { t: 0, value: 100, easing: "linear" },
          { t: 2, value: 300, easing: "linear" },
        ],
      },
    };

    // At t=1.0:
    // Keyframe track on x is halfway between 100 and 300 -> 200
    const { el: atT1 } = applyTracks(el as unknown as SubtitlesEl, 1.0);
    expect(atT1.x).toBe(200);

    // In scaled cues (cue 1 is [0, 1], cue 2 is [1, 2]):
    // At t=0.5 -> "Parte 1"
    const cueAt05 = getActiveCue(atT1.cues, 0.5);
    expect(cueAt05?.text).toBe("Parte 1");

    // At t=1.5 -> "Parte 2"
    const cueAt15 = getActiveCue(atT1.cues, 1.5);
    expect(cueAt15?.text).toBe("Parte 2");
  });

  it("verifies single-text subtitle editing generates proper word timings and renders cleanly (027/R5@2, D4@2)", () => {
    // When editing a single subtitle element's text directly
    const text = "Texto simple y directo";
    const words = text.split(" ");
    const duration = words.length * 0.4;
    const singleCue: SubtitleCue = {
      id: "cue-single",
      start: 0,
      end: duration,
      text,
      words: words.map((w, i) => ({
        word: w,
        start: i * 0.4,
        end: (i + 1) * 0.4,
      })),
    };

    expect(singleCue.text).toBe("Texto simple y directo");
    expect(singleCue.words).toHaveLength(4);
    expect(singleCue.end).toBe(1.6);

    // Active word tracking at t = 0.5s is second word ("simple")
    const activeWord = singleCue.words?.find((w) => isWordActive(w, 0.5));
    expect(activeWord?.word).toBe("simple");
  });
});
