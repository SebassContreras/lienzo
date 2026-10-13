import { describe, expect, it } from "vitest";
import {
  compositeRgba,
  contrastRatio,
  oklchToRgb,
  parseColor,
  relativeLuminance,
  rgbToOklch,
  suggestAccessibleColor,
} from "./color.ts";

describe("pure color.ts (023/D3, R6, R11)", () => {
  it("parses hex and rgba colors correctly", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255, 1]);
    expect(parseColor("#000000")).toEqual([0, 0, 0, 1]);
    expect(parseColor("#ff000080")[3]).toBeCloseTo(0.5, 1);
    expect(parseColor("rgba(100, 150, 200, 0.5)")).toEqual([
      100, 150, 200, 0.5,
    ]);
  });

  it("calculates WCAG 2.2 relative luminance for pure white and pure black", () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 4);
    expect(relativeLuminance(0, 0, 0)).toBeCloseTo(0, 4);
  });

  it("calculates WCAG contrast ratio 21:1 for black on white", () => {
    const white = relativeLuminance(255, 255, 255);
    const black = relativeLuminance(0, 0, 0);
    expect(contrastRatio(white, black)).toBeCloseTo(21, 1);
  });

  it("composites transparent foreground over background correctly", () => {
    // 50% white over black
    const fg = [255, 255, 255, 0.5] as [number, number, number, number];
    const bg = [0, 0, 0, 1] as [number, number, number, number];
    const out = compositeRgba(fg, bg);
    expect(out[0]).toBeCloseTo(127.5, 1);
    expect(out[1]).toBeCloseTo(127.5, 1);
    expect(out[2]).toBeCloseTo(127.5, 1);
    expect(out[3]).toBe(1);
  });

  it("round-trips rgb to oklch and back", () => {
    const orig = [200, 80, 50] as const;
    const oklch = rgbToOklch(orig[0], orig[1], orig[2]);
    const rgb = oklchToRgb(oklch);
    expect(rgb[0]).toBeCloseTo(orig[0], 0);
    expect(rgb[1]).toBeCloseTo(orig[1], 0);
    expect(rgb[2]).toBeCloseTo(orig[2], 0);
  });

  it("suggests an accessible color that meets required WCAG threshold", () => {
    // Light grey text on white fails 4.5:1
    const fg = "#cccccc";
    const bgRgb: [number, number, number] = [255, 255, 255];
    const suggested = suggestAccessibleColor(fg, bgRgb, 4.5);
    const suggestedRgb = parseColor(suggested);
    const lumSug = relativeLuminance(
      suggestedRgb[0],
      suggestedRgb[1],
      suggestedRgb[2],
    );
    const lumBg = relativeLuminance(bgRgb[0], bgRgb[1], bgRgb[2]);
    expect(contrastRatio(lumSug, lumBg)).toBeGreaterThanOrEqual(4.5);
  });
});
