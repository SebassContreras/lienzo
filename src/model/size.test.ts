import { expect, it } from "vitest";
import { parseSize } from "./size.ts";

it("takes a 9:16 ratio as the vertical story canvas", () => {
  expect(parseSize("9:16")).toEqual({ width: 1080, height: 1920 });
});

it("takes WxH with spaces and the × sign", () => {
  expect(parseSize("800 × 600")).toEqual({ width: 800, height: 600 });
});

it("takes a size preset by its name, any case", () => {
  expect(parseSize("story")).toEqual({ width: 1080, height: 1920 });
});

it("rejects an unknown size naming the accepted forms", () => {
  expect(parseSize("potato")).toEqual({
    error: expect.stringMatching(/«potato».*9:16.*Story/),
  });
});
