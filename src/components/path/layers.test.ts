import { describe, expect, it } from "vitest";
import { type Ctx, rgba } from "../../engine/paint.ts";
import { drawScene } from "../../engine/render.ts";
import {
  defaultElement,
  defaultScene,
  type Element,
} from "../../model/model.ts";
import { installCanvasFakes, RecordingCtx } from "../../test/recording-ctx.ts";
import type { PathEl } from "./descriptor.ts";

installCanvasFakes();

const SQUARE = "M0 0 H100 V100 H0 Z";
const TRIANGLE = "M0 100 L50 0 L100 100 Z";

function pathEl(over: Partial<PathEl>): PathEl {
  return { ...(defaultElement("path") as PathEl), ...over };
}

/** Every canvas call the scene makes with `el` as its only element. */
function logOf(el: Element): string[] {
  const ctx = new RecordingCtx();
  drawScene(ctx as unknown as Ctx, { ...defaultScene(), elements: [el] }, 1);
  return ctx.log;
}

/** The `prop` values `el` paints with, in order, leaving out the background's. */
function styles(el: Element, prop: "fillStyle" | "strokeStyle"): string[] {
  const background = logOf({ ...el, opacity: 0 }).length;
  return logOf(el)
    .slice(background - 1)
    .filter((l) => l.startsWith(`${prop}=`));
}

const fillsOf = (el: Element) => styles(el, "fillStyle");
const strokesOf = (el: Element) => styles(el, "strokeStyle");

describe("path layers", () => {
  it("paints every shape in list order, each with its own fill", () => {
    const el = pathEl({
      mode: "layers",
      shapes: [
        { d: SQUARE, fill: "#ff0000" },
        { d: TRIANGLE, fill: "#00ff00" },
      ],
    });

    expect(fillsOf(el)).toEqual(["fillStyle=(#ff0000)", "fillStyle=(#00ff00)"]);
  });

  it("falls back to the element's fill and stroke for a shape without its own", () => {
    // paths have no stroke by default since 063, so this one asks for one
    const plain = defaultElement("path") as PathEl;
    const el = pathEl({
      mode: "layers",
      shapes: [{ d: SQUARE, stroke: "#123456" }, { d: TRIANGLE }],
      border: { ...plain.border, width: 3 },
    });

    const fills = fillsOf(el);
    const strokes = strokesOf(el);

    expect(fills).toEqual([
      `fillStyle=(${el.fill.color})`,
      `fillStyle=(${el.fill.color})`,
    ]);
    expect(strokes).toEqual([
      `strokeStyle=(${rgba("#123456", el.border.opacity)})`,
      `strokeStyle=(${rgba(el.border.color, el.border.opacity)})`,
    ]);
  });

  it("ignores the morph value in layers mode", () => {
    const shapes = [
      { d: SQUARE, fill: "#ff0000" },
      { d: TRIANGLE, fill: "#00ff00" },
    ];
    const still = pathEl({ mode: "layers", shapes, morph: 0 });
    const keyed = pathEl({ mode: "layers", shapes, morph: 0.5 });

    expect(fillsOf(keyed)).toEqual(fillsOf(still));
  });

  it("skips a shape that does not parse and draws the rest", () => {
    const el = pathEl({
      mode: "layers",
      shapes: [
        { d: "M0 0 L", fill: "#ff0000" },
        { d: TRIANGLE, fill: "#00ff00" },
      ],
    });

    expect(fillsOf(el)).toEqual(["fillStyle=(#00ff00)"]);
  });
});

describe("path without a mode", () => {
  it("still morphs between its shapes", () => {
    const shapes = [
      { d: SQUARE, fill: "#ff0000" },
      { d: TRIANGLE, fill: "#0000ff" },
    ];
    const el = pathEl({ shapes, morph: 0.5 });

    const fills = fillsOf(el);

    expect(el.mode).toBe("morph");
    expect(fills).toHaveLength(1);
    expect(fills[0]).not.toBe("fillStyle=(#ff0000)");
    expect(fills[0]).not.toBe("fillStyle=(#0000ff)");
  });
});
