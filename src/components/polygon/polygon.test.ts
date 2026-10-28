import { describe, expect, it } from "vitest";
import { ElementSchema } from "../../model/element-schema.ts";
import { defaultElement } from "../../model/model.ts";
import type { PolygonEl } from "./descriptor.ts";
import { polygonPoints, radialPoints } from "./draw.ts";

const box = { x: 100, y: 200, w: 300, h: 150 };

function polygon(over: Partial<PolygonEl>): PolygonEl {
  return { ...(defaultElement("polygon") as PolygonEl), ...box, ...over };
}

describe("polygon fit", () => {
  it("a box-fitted triangle's base sits on the box bottom and its apex on the top", () => {
    const roof = polygon({ sides: 3, fit: "box" });

    const ys = polygonPoints(roof).map((p) => p.y);

    expect(Math.min(...ys)).toBeCloseTo(box.y, 6);
    expect(Math.max(...ys)).toBeCloseTo(box.y + box.h, 6);
  });

  it("a box-fitted hexagon spans the full box width", () => {
    const hex = polygon({ sides: 6, fit: "box" });

    const xs = polygonPoints(hex).map((p) => p.x);

    expect(Math.min(...xs)).toBeCloseTo(box.x, 6);
    expect(Math.max(...xs)).toBeCloseTo(box.x + box.w, 6);
  });

  it("an older polygon reads as circle-fitted and keeps its inscribed points", () => {
    const { fit: _, ...old } = polygon({ sides: 3 });

    const parsed = ElementSchema.parse(old) as PolygonEl;

    expect(parsed.fit).toBe("circle");
    expect(polygonPoints(parsed)).toEqual(radialPoints(parsed, 3));
  });
});
