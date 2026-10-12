import { describe, expect, it } from "vitest";
import { SNAP_PX, snapBox, unionBox } from "./snap.ts";

const canvas = { width: 1000, height: 1000 };
const box = (x: number, y: number, w = 100, h = 100) => ({ x, y, w, h });

describe("snapBox", () => {
  it("snaps an edge to a nearby element's edge and draws a guide", () => {
    const s = snapBox(box(203, 400), [box(100, 100)], canvas, 1);
    expect(s.dx).toBe(-3);
    expect(s.guides).toContainEqual({ axis: "x", at: 200, from: 100, to: 500 });
  });

  it("snaps centres, also to the canvas centre", () => {
    const s = snapBox(box(448, 700), [], canvas, 1);
    expect(s.dx).toBe(2);
    expect(s.guides).toContainEqual({
      axis: "x",
      at: 500,
      from: -Infinity,
      to: Infinity,
    });
  });

  it("converts the threshold by the zoom", () => {
    const far = 300 + SNAP_PX + 2;
    const others = [box(100, 100, 200)];
    expect(snapBox(box(far, 600), others, canvas, 1).dx).toBe(0);
    expect(snapBox(box(far, 600), others, canvas, 0.5).dx).toBe(300 - far);
  });

  it("does nothing when disabled", () => {
    const s = snapBox(box(203, 400), [box(100, 100)], canvas, 1, false);
    expect(s).toEqual({ dx: 0, dy: 0, guides: [], gaps: [] });
  });

  it("snaps to an equal gap between two neighbours and marks both gaps", () => {
    // gaps 52 and 48 around the moving box: moving 2 left makes both 50
    const s = snapBox(box(352, 620), [box(200, 600), box(500, 640)], canvas, 1);
    expect(s.dx).toBe(-2);
    expect(s.gaps).toEqual([
      { axis: "x", from: 300, to: 350, at: 660 },
      { axis: "x", from: 450, to: 500, at: 680 },
    ]);
  });
});

describe("unionBox", () => {
  it("spans every box", () => {
    expect(unionBox([box(0, 0, 10, 10), box(20, 5, 10, 20)])).toEqual({
      x: 0,
      y: 0,
      w: 30,
      h: 25,
    });
    expect(unionBox([])).toBeUndefined();
  });
});
