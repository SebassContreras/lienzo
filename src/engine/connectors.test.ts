import { describe, expect, it } from "vitest";
import { createElement } from "../components/index.ts";
import type { Anchor, Element, LineEl, Route } from "../model/model.ts";
import { indexById } from "./geometry.ts";
import {
  anchorPoint,
  elbowPoints,
  nearestAnchor,
  pointAtFraction,
  resolveLine,
  samplePath,
} from "./lines.ts";

const card = (id: string, x: number, y: number, w = 200, h = 100) =>
  ({ ...createElement("rect"), id, x, y, w, h }) as Element;

function line(route: Route, anchorA?: Anchor, anchorB?: Anchor): LineEl {
  return {
    ...createElement("line"),
    id: "l",
    route,
    a: { x: 0, y: 0, attach: "A", anchor: anchorA },
    b: { x: 0, y: 0, attach: "B", anchor: anchorB },
    width: 2,
  } as LineEl;
}

const resolve = (l: LineEl, ...els: Element[]) =>
  resolveLine(l, indexById({ elements: [...els, l] } as never));

const GAP = 10; // 8 + width 2

describe("anchors", () => {
  const outline = { box: { x: 100, y: 100, w: 200, h: 100 }, round: false };

  it("places each fixed anchor on the outline", () => {
    const far = { x: 0, y: 0 };
    expect(anchorPoint(outline, "top", far)).toEqual({ x: 200, y: 100 });
    expect(anchorPoint(outline, "bottom", far)).toEqual({ x: 200, y: 200 });
    expect(anchorPoint(outline, "left", far)).toEqual({ x: 100, y: 150 });
    expect(anchorPoint(outline, "right", far)).toEqual({ x: 300, y: 150 });
    expect(anchorPoint(outline, "center", far)).toEqual({ x: 200, y: 150 });
  });

  it("puts auto where the outline faces the other point", () => {
    expect(anchorPoint(outline, "auto", { x: 1000, y: 150 })).toEqual({
      x: 300,
      y: 150,
    });
  });

  it("picks the fixed anchor near the pointer, else auto", () => {
    expect(nearestAnchor(outline, { x: 205, y: 104 }, 12)).toBe("top");
    expect(nearestAnchor(outline, { x: 150, y: 120 }, 12)).toBe("auto");
  });
});

describe("ends follow their target", () => {
  it("tracks a moved and a resized target at the anchor", () => {
    const l = line("straight", "right", "left");
    const a = card("A", 0, 0);
    const b = card("B", 500, 0);
    expect(resolve(l, a, b).a).toEqual({ x: 200 + GAP, y: 50 });
    const moved = { ...a, x: 40, y: 60 } as Element;
    expect(resolve(l, moved, b).a).toEqual({ x: 240 + GAP, y: 110 });
    const resized = { ...b, h: 300 } as Element;
    expect(resolve(l, a, resized).b).toEqual({ x: 500 - GAP, y: 150 });
  });
});

describe("routes", () => {
  const a = card("A", 0, 0);
  const b = card("B", 500, 300);

  it("draws a straight route as a line between the ends", () => {
    const r = resolve(line("straight", "right", "left"), a, b);
    const s = samplePath(r);
    expect(s.total).toBeCloseTo(Math.hypot(r.b.x - r.a.x, r.b.y - r.a.y), 3);
  });

  it("draws the elbow route in axis-aligned legs leaving each side", () => {
    const r = resolve(line("orthogonal", "right", "left"), a, b);
    const pts = elbowPoints(r);
    expect(pts[0]).toEqual(r.a);
    expect(pts.at(-1)).toEqual(r.b);
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1] as { x: number; y: number };
      const q = pts[i] as { x: number; y: number };
      expect(p.x === q.x || p.y === q.y).toBe(true);
    }
    expect((pts[1] as { y: number }).y).toBe(r.a.y);
  });

  it("draws the curved route leaving and arriving along each side", () => {
    const r = resolve(line("curved", "bottom", "top"), a, b);
    const s = samplePath(r);
    expect(s.pts[0]).toEqual(r.a);
    expect(s.pts.at(-1)).toEqual(r.b);
    // leaves the bottom going down, arrives at the top going down
    expect(pointAtFraction(s, 0).angle).toBeCloseTo(Math.PI / 2, 1);
    expect(pointAtFraction(s, 1).angle).toBeCloseTo(Math.PI / 2, 1);
  });

  it("points the arrows along the last and first legs of each route", () => {
    for (const route of ["straight", "orthogonal", "curved"] as const) {
      const s = samplePath(resolve(line(route, "right", "left"), a, b));
      const end = pointAtFraction(s, 1).angle;
      if (route !== "straight") expect(end).toBeCloseTo(0, 1);
      expect(pointAtFraction(s, 0).p).toEqual(s.pts[0]);
    }
  });
});
