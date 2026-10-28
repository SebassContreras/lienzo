import { describe, expect, it } from "vitest";
import { installCanvasFakes, RecordingCtx } from "../test/recording-ctx.ts";
import { type Ctx, fillGradient, gradientStops } from "./paint.ts";

installCanvasFakes();

const box = { x: 0, y: 0, w: 200, h: 100 };
const twoColor = {
  angle: 0,
  color: "#000000",
  color2: "#ffffff",
};

/** What a gradient records: how it was created, then its stops. */
function logOf(g: CanvasGradient): string[] {
  return (g as unknown as { log: string[] }).log;
}

const ctx = () => new RecordingCtx() as unknown as Ctx;

describe("gradient stops", () => {
  it("runs from `color` to `color2` when the fill has no stops", () => {
    expect(gradientStops(twoColor)).toEqual([
      { at: 0, color: "#000000" },
      { at: 1, color: "#ffffff" },
    ]);
  });

  it("keeps the fill's own stops in their order, same-offset ones included", () => {
    const stops = [
      { at: 0, color: "#ff0000" },
      { at: 0.5, color: "#ff0000" },
      { at: 0.5, color: "#0000ff" },
      { at: 1, color: "#0000ff" },
    ];

    expect(gradientStops({ ...twoColor, stops })).toEqual(stops);
  });
});

describe("fill gradient", () => {
  it("a radial fill grows from the box centre out to its farthest corner", () => {
    const g = fillGradient(ctx(), box, { ...twoColor, type: "radial" });

    expect(logOf(g)[0]).toBe(
      `radial(100,50,0,100,50,${Number(Math.hypot(100, 50).toFixed(6))})`,
    );
  });

  it("a linear fill keeps the two-color endpoints it had in older scenes", () => {
    const g = fillGradient(ctx(), box, twoColor);

    expect(logOf(g)).toEqual([
      "linear(0,50,200,50)",
      "stop(0,#000000)",
      "stop(1,#ffffff)",
    ]);
  });

  it("adds every stop of a multi-stop fill", () => {
    const stops = [
      { at: 0, color: "#ff0000" },
      { at: 0.3, color: "#00ff00" },
      { at: 1, color: "#0000ff" },
    ];

    const g = fillGradient(ctx(), box, { ...twoColor, stops });

    expect(logOf(g).slice(1)).toEqual([
      "stop(0,#ff0000)",
      "stop(0.3,#00ff00)",
      "stop(1,#0000ff)",
    ]);
  });
});
