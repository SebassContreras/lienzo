import { expect, it } from "vitest";
import { PNG_1X1 } from "../../test/png.ts";
import { imageSize } from "./image-header.ts";

it("reads a picture's size and rejects other bytes (069/D8)", () => {
  expect(imageSize(PNG_1X1)).toEqual({ width: 1, height: 1 });
  const svg = new TextEncoder().encode(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"></svg>',
  );
  expect(imageSize(svg)).toEqual({ width: 400, height: 300 });
  expect(
    imageSize(new TextEncoder().encode("not a png at all")),
  ).toBeUndefined();
});
