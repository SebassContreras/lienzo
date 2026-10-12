import { describe, expect, it } from "vitest";
import { createElement } from "../index.ts";
import { poseAt } from "./pose.ts";

const el = { ...createElement("three"), spin: 2 } as never;

describe("3D pose (016/D5, R5)", () => {
  it("gives the same pose for the same t", () => {
    expect(poseAt(el, 1.3, 4)).toEqual(poseAt(el, 1.3, 4));
  });

  it("closes the loop: the end is the start again", () => {
    const start = poseAt(el, 0, 4).rotation[1];
    const end = poseAt(el, 4, 4).rotation[1];
    expect(Math.cos(end)).toBeCloseTo(Math.cos(start));
    expect(Math.sin(end)).toBeCloseTo(Math.sin(start));
    expect(poseAt(el, 1, 4).rotation[1]).not.toBeCloseTo(start);
  });
});
