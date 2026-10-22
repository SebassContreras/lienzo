import { describe, expect, it } from "vitest";
import type { ResolvedFont } from "../model/font-files.ts";
import { defaultScene, type Scene } from "../model/model.ts";
import { missingFonts } from "./fonts.ts";

const sceneWithFonts = (...fonts: string[]): Scene => ({
  ...defaultScene(),
  elements: fonts.map(
    (font, i) => ({ id: `t${i}`, kind: "text", font }) as never,
  ),
});

const available: ResolvedFont[] = [
  { family: "Inter", weight: 400, origin: "bundled" },
];

describe("missingFonts", () => {
  it("names a family the scene uses that no font provides", () => {
    expect(missingFonts(sceneWithFonts("Inter", "Brand"), available)).toEqual([
      "Brand",
    ]);
  });

  it("reports nothing when every family is available", () => {
    expect(missingFonts(sceneWithFonts("Inter"), available)).toEqual([]);
  });
});
