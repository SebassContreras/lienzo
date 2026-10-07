import { describe, expect, it } from "vitest";
import { defaultLine, defaultRect, type Element } from "../model/model.ts";
import {
  controlPoint,
  distToPath,
  pointAtFraction,
  resolveLine,
  samplePath,
} from "./geometry.ts";

describe("line geometry", () => {
  it("bend offsets the control point perpendicular to the chord", () => {
    expect(controlPoint({ x: 0, y: 0 }, { x: 100, y: 0 }, 20)).toEqual({
      x: 50,
      y: 20,
    });
  });

  it("samples a straight line with the right length and midpoint", () => {
    const s = samplePath({
      a: { x: 0, y: 0 },
      b: { x: 200, y: 0 },
      c: { x: 100, y: 0 },
    });
    expect(s.total).toBeCloseTo(200, 6);
    expect(pointAtFraction(s, 0.5).p.x).toBeCloseTo(100, 6);
    expect(distToPath(s, { x: 50, y: 10 })).toBeCloseTo(10, 6);
  });

  it("an attached end sits on the target's edge, pushed out by the gap", () => {
    const card = { ...defaultRect(), x: 0, y: 0, w: 100, h: 100 };
    const line = defaultLine();
    line.a = { x: 0, y: 0, attach: card.id };
    line.b = { x: 300, y: 50 };
    const byId = new Map<string, Element>([[card.id, card]]);
    const r = resolveLine(line, byId);
    expect(r.a.x).toBeCloseTo(100 + 8 + line.width, 6);
    expect(r.a.y).toBeCloseTo(50, 6);
    expect(r.b).toEqual({ x: 300, y: 50 });
  });

  it("an attachment to a missing element falls back to the stored point", () => {
    const line = defaultLine();
    line.a = { x: 10, y: 20, attach: "gone" };
    expect(resolveLine(line, new Map()).a).toMatchObject({ x: 10, y: 20 });
  });
});
