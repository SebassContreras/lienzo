import { describe, expect, it } from "vitest";
import { matchedWeight } from "./fonts.ts";

describe("matchedWeight (CSS Fonts 4 §5.2)", () => {
  it("keeps a weight the family has", () => {
    expect(matchedWeight([400, 700], 700)).toBe(700);
  });

  it("goes down from a wanted weight above 500 only when nothing is heavier", () => {
    expect(matchedWeight([400, 600, 800], 900)).toBe(800);
  });

  it("goes up first from a wanted weight above 500", () => {
    expect(matchedWeight([400, 800], 600)).toBe(800);
  });

  it("goes down first from a wanted weight below 400", () => {
    expect(matchedWeight([300, 400, 700], 200)).toBe(300);
    expect(matchedWeight([400, 700], 200)).toBe(400);
  });

  it("looks up to 500 before down when 400 is wanted", () => {
    expect(matchedWeight([300, 500], 400)).toBe(500);
  });

  it("looks at 400 before up when 500 is wanted", () => {
    expect(matchedWeight([400, 600], 500)).toBe(400);
  });

  it("falls back to 400 for a family with no weights", () => {
    expect(matchedWeight([], 700)).toBe(400);
  });
});
