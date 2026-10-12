import { describe, expect, it } from "vitest";
import { createElement } from "../components/index.ts";
import { demoScene } from "../demo.ts";
import { type Box, boxOf } from "../engine/geometry.ts";
import type { Scene } from "../model/model.ts";
import { type AlignAction, alignElements } from "./align.ts";

const rect = (id: string, x: number, y: number, w: number) => ({
  ...createElement("rect"),
  id,
  x,
  y,
  w,
  h: 20,
});

const scene = (): Scene => ({
  ...demoScene(),
  elements: [
    rect("a", 0, 0, 40),
    rect("b", 100, 50, 20),
    rect("c", 300, 10, 60),
  ],
});

const boxes = (s: Scene) => s.elements.map((el) => boxOf(el));

describe("alignElements", () => {
  const cases: [AlignAction, (b: Box) => number, number][] = [
    ["left", (b) => b.x, 0],
    ["right", (b) => b.x + b.w, 360],
    ["centerX", (b) => b.x + b.w / 2, 180],
    ["top", (b) => b.y, 0],
    ["bottom", (b) => b.y + b.h, 70],
    ["centerY", (b) => b.y + b.h / 2, 35],
  ];
  for (const [action, at, value] of cases) {
    it(`aligns ${action}`, () => {
      const out = alignElements(scene(), ["a", "b", "c"], action);
      for (const b of boxes(out)) expect(at(b)).toBe(value);
    });
  }

  it("distributes evenly between the outermost", () => {
    const out = boxes(alignElements(scene(), ["a", "b", "c"], "distributeX"));
    // span 0..360 holds 40 + 20 + 60: two gaps of 120
    expect(out.map((b) => b.x)).toEqual([0, 160, 300]);
    expect(out.map((b) => b.y)).toEqual([0, 50, 10]);
  });

  it("leaves the scene alone with fewer than two", () => {
    const s = scene();
    expect(alignElements(s, ["a"], "left")).toBe(s);
  });
});
