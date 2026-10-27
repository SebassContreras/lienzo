import { describe, expect, it } from "vitest";
import {
  fontStringOf,
  loadFontSync,
  measureFontMetrics,
  measureTextWidth,
  measureWithOpentype,
} from "./text-measure.ts";

describe("text measurement (054/R1, T005)", () => {
  it("loads bundled font tables in Node", () => {
    const inter = loadFontSync("Inter", 400);
    expect(inter).not.toBeNull();
    expect(inter?.unitsPerEm).toBe(2048);

    const spaceGrotesk = loadFontSync("Space Grotesk", 700);
    expect(spaceGrotesk).not.toBeNull();
    expect(spaceGrotesk?.unitsPerEm).toBe(1000);

    const poppins = loadFontSync("Poppins", 600);
    expect(poppins).not.toBeNull();

    const jetbrains = loadFontSync("JetBrains Mono", 400);
    expect(jetbrains).not.toBeNull();

    const caveat = loadFontSync("Caveat", 400);
    expect(caveat).not.toBeNull();

    const pressStart = loadFontSync("Press Start 2P", 400);
    expect(pressStart).not.toBeNull();
  });

  it("produces accurate widths matching real glyph advance metrics", () => {
    // Given a text element with Inter 64px
    const style = { font: "Inter", size: 64, weight: 800 };
    const text = "Hello world";

    // When measuring width
    const measured = measureTextWidth(text, style);

    // Then width should be strictly positive and reflect real font glyph advance
    // Inter 800 64px "Hello world" is ~370-380px (roughly 5-6x char count of 64px)
    expect(measured).toBeGreaterThan(300);
    expect(measured).toBeLessThan(450);

    // Old heuristic was 11 * 10 = 110px. Measured must be within 10% of opentype ground truth
    const font = loadFontSync("Inter", 800);
    expect(font).not.toBeNull();
    if (!font) throw new Error("font not loaded");
    const directOpentype = measureWithOpentype(font, text, 64);
    const diffRatio = Math.abs(measured - directOpentype) / directOpentype;
    expect(diffRatio).toBeLessThanOrEqual(0.01);
  });

  it("scales accurately across font sizes and weights", () => {
    const text = "Lienzo Visual Canvas";
    const w32 = measureTextWidth(text, {
      font: "Inter",
      size: 32,
      weight: 400,
    });
    const w64 = measureTextWidth(text, {
      font: "Inter",
      size: 64,
      weight: 400,
    });

    // Scaling size by 2 should double the width within 1% (accounting for rounding/kerning)
    expect(w64 / w32).toBeCloseTo(2.0, 1);

    // Heavier weights have equal or wider advance
    const w64Bold = measureTextWidth(text, {
      font: "Inter",
      size: 64,
      weight: 800,
    });
    expect(w64Bold).toBeGreaterThanOrEqual(w64);
  });

  it("takes letterSpacing into account", () => {
    const text = "SPACED";
    const normal = measureTextWidth(text, {
      font: "Inter",
      size: 32,
      weight: 400,
      letterSpacing: 0,
    });
    const spaced = measureTextWidth(text, {
      font: "Inter",
      size: 32,
      weight: 400,
      letterSpacing: 10,
    });

    // 6 characters -> 5 gaps of 10px = 50px difference
    expect(spaced - normal).toBeCloseTo(50, 1);
  });

  it("extracts vertical font metrics from font tables", () => {
    const metrics = measureFontMetrics({
      font: "Inter",
      size: 100,
      weight: 400,
    });
    expect(metrics.ascent).toBeGreaterThan(50);
    expect(metrics.descent).toBeGreaterThan(10);
    expect(metrics.lineHeight).toBeGreaterThan(metrics.ascent);
  });

  it("formats standard CSS font strings", () => {
    expect(fontStringOf({ font: "Inter", size: 64, weight: 700 })).toBe(
      '700 64px "Inter", "Inter", sans-serif',
    );
    expect(
      fontStringOf({ font: "Poppins", size: 32, weight: 400, italic: true }),
    ).toBe('italic 400 32px "Poppins", "Inter", sans-serif');
  });

  it("handles empty strings and fallbacks gracefully", () => {
    expect(measureTextWidth("", { font: "Inter", size: 64, weight: 400 })).toBe(
      0,
    );
    const fallback = measureTextWidth("Custom", {
      font: "NonExistentFont",
      size: 50,
      weight: 400,
    });
    expect(fallback).toBe(
      measureTextWidth("Custom", { font: "Inter", size: 50, weight: 400 }),
    );
  });
});
