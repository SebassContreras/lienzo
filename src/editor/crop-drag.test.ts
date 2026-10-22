import { describe, expect, it } from "vitest";
import { createElement } from "../components/index.ts";
import { defaultScene, type ImageEl } from "../model/model.ts";
import { parseScene } from "../model/schema.ts";
import { dragCropEdge } from "./crop-drag.ts";

/** The whole picture. */
const FULL_CROP = { x: 0, y: 0, w: 1, h: 1 };

/** A 2:1 picture shown whole in a 200×100 box at (100, 50). */
function image(): ImageEl {
  const el = createElement("image") as ImageEl;
  return { ...el, x: 100, y: 50, w: 200, h: 100, aspect: 2, crop: FULL_CROP };
}

describe("dragCropEdge", () => {
  it("crops from the east side without stretching the picture", () => {
    const el = image();

    const cropped = dragCropEdge(el, "e", -100);

    expect(cropped.crop).toEqual({ x: 0, y: 0, w: 0.5, h: 1 });
    expect({ x: cropped.x, w: cropped.w, h: cropped.h }).toEqual({
      x: 100,
      w: 100,
      h: 100,
    });
    expect(cropped.aspect).toBe(1);
  });

  it("crops from the north side and moves the box down by the same amount", () => {
    const el = image();

    const cropped = dragCropEdge(el, "n", 25);

    expect(cropped.crop).toEqual({ x: 0, y: 0.25, w: 1, h: 0.75 });
    expect({ y: cropped.y, h: cropped.h }).toEqual({ y: 75, h: 75 });
  });

  it("does not let a side go past the edge of the picture", () => {
    const el = image();

    const cropped = dragCropEdge(el, "w", -500);

    expect(cropped.crop).toEqual(FULL_CROP);
    expect(cropped.x).toBe(100);
  });

  it("keeps a minimum crop size when a side is dragged past the opposite one", () => {
    const el = image();

    const cropped = dragCropEdge(el, "e", -500);

    expect(cropped.w).toBe(16);
  });
});

describe("a scene saved before cropping existed", () => {
  it("opens with the whole picture shown", () => {
    const { crop: _, ...old } = image();

    const parsed = parseScene({ ...defaultScene(), elements: [old] });

    expect(parsed.ok && (parsed.value.elements[0] as ImageEl).crop).toEqual(
      FULL_CROP,
    );
  });
});
