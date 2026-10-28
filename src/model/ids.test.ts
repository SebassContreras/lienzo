import { expect, it } from "vitest";
import { duplicateIds } from "./ids.ts";
import { defaultGroup, defaultRect, type Element } from "./model.ts";

const rect = (id: string) => ({ ...defaultRect(), id });

it("reports an id repeated among siblings with where it was first seen", () => {
  expect(duplicateIds([rect("x"), rect("y"), rect("x")])).toEqual([
    { id: "x", first: "elements.0", path: "elements.2" },
  ]);
});

it("reports an id repeated between a group's child and a root element", () => {
  const group = { ...defaultGroup(), id: "g", children: [rect("x")] };
  expect(duplicateIds([group, rect("x")])).toEqual([
    { id: "x", first: "elements.0.children.0", path: "elements.1" },
  ]);
});

it("reports nothing when every id is different", () => {
  expect(duplicateIds([rect("a"), rect("b")])).toEqual([]);
});

it("reads a scene that did not parse: skips what is not an element, an id that is not text, and children outside a group", () => {
  const broken = [
    null,
    { kind: "rect", id: 5 },
    { kind: "rect", id: 5 },
    { kind: "group", id: "g" },
    { ...rect("r"), children: [rect("a")] },
    rect("a"),
  ] as unknown as Element[];
  expect(duplicateIds(broken)).toEqual([]);
});
