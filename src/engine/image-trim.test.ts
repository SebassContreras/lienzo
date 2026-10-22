import { describe, expect, it } from "vitest";
import { createElement } from "../components/index.ts";
import type { ImageEl } from "../model/model.ts";
import { alphaBounds, applyCrop } from "./image-trim.ts";

/** RGBA bytes of a `width`×`height` picture, transparent but for `alpha` at the given pixels. */
function picture(
  width: number,
  height: number,
  opaque: [number, number][],
  alpha = 255,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (const [x, y] of opaque) data[(y * width + x) * 4 + 3] = alpha;
  return data;
}

/** The whole picture. */
const FULL_CROP = { x: 0, y: 0, w: 1, h: 1 };

/** A 400×200 picture shown whole in a 200×100 box at (100, 50). */
function image(): ImageEl {
  const el = createElement("image") as ImageEl;
  return { ...el, x: 100, y: 50, w: 200, h: 100, aspect: 2, crop: FULL_CROP };
}

describe("alphaBounds", () => {
  it("returns the rectangle of the visible pixels inside a transparent margin", () => {
    const data = picture(10, 10, [
      [2, 3],
      [6, 7],
    ]);

    const bounds = alphaBounds(data, 10, 10);

    expect(bounds).toEqual({ x: 0.2, y: 0.3, w: 0.5, h: 0.5 });
  });

  it("returns undefined for a fully transparent picture", () => {
    const data = picture(4, 4, []);

    expect(alphaBounds(data, 4, 4)).toBeUndefined();
  });

  it("ignores faint pixels at or below the threshold", () => {
    const data = picture(4, 4, [[0, 0]], 8);

    expect(alphaBounds(data, 4, 4)).toBeUndefined();
  });
});

describe("applyCrop", () => {
  it("keeps the shown content in place and at the same scale when trimming", () => {
    const el = image();

    const trimmed = applyCrop(el, { x: 0.25, y: 0.5, w: 0.5, h: 0.5 });

    expect({ x: trimmed.x, y: trimmed.y, w: trimmed.w, h: trimmed.h }).toEqual({
      x: 150,
      y: 100,
      w: 100,
      h: 50,
    });
    expect(trimmed.aspect).toBe(2);
  });

  it("gives the cropped picture's aspect ratio", () => {
    const el = image();

    const trimmed = applyCrop(el, { x: 0, y: 0, w: 0.5, h: 1 });

    expect(trimmed.aspect).toBe(1);
  });

  it("restores the whole picture at the same scale when the crop is removed", () => {
    const el = image();
    const cropped = applyCrop(el, { x: 0.25, y: 0.5, w: 0.5, h: 0.5 });

    const restored = applyCrop(cropped, FULL_CROP);

    expect(restored).toEqual(el);
  });
});
