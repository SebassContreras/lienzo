import { describe, expect, it } from "vitest";
import { groupElements } from "../engine/groups.ts";
import {
  defaultRect,
  defaultScene,
  type Element,
  type GroupEl,
  type Scene,
} from "./model.ts";
import {
  freeSymbolName,
  instanceCount,
  replaceWithUse,
  withSymbol,
} from "./symbols.ts";

/** A scene with two rects at (100,100) and (300,200), grouped. */
function groupedScene(): { scene: Scene; group: GroupEl } {
  const a = { ...defaultRect(), id: "a", x: 100, y: 100, w: 50, h: 50 };
  const b = { ...defaultRect(), id: "b", x: 300, y: 200, w: 50, h: 50 };
  const { scene, group } = groupElements(
    { ...defaultScene(), elements: [a, b] },
    ["a", "b"],
  );
  return { scene, group: group as GroupEl };
}

describe("replaceWithUse", () => {
  it("stores the group's children relative to its box", () => {
    const { scene, group } = groupedScene();

    const next = replaceWithUse(scene, group.id, "car");

    expect(next.symbols?.car).toMatchObject({
      w: 250,
      h: 150,
      children: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 200, y: 100 },
      ],
    });
  });

  it("puts a use of the same box and id in the group's place", () => {
    const { scene, group } = groupedScene();

    const next = replaceWithUse(scene, group.id, "car");

    expect(next.elements).toEqual([
      expect.objectContaining({
        kind: "use",
        id: group.id,
        symbol: "car",
        x: 100,
        y: 100,
        w: 250,
        h: 150,
      }),
    ]);
  });

  it("leaves the scene unchanged for an element that is not a group", () => {
    const { scene } = groupedScene();

    const next = replaceWithUse(scene, "missing", "car");

    expect(next).toBe(scene);
  });
});

describe("withSymbol", () => {
  it("changes the symbol every instance draws", () => {
    const { scene, group } = groupedScene();
    const withUse = replaceWithUse(scene, group.id, "car");
    const twice: Scene = {
      ...withUse,
      elements: [
        ...withUse.elements,
        { ...(withUse.elements[0] as Element), id: "copy" },
      ],
    };
    const wheel = { ...defaultRect(), id: "wheel" };

    const next = withSymbol(twice, "car", { children: [wheel] });

    expect(next.symbols?.car?.children).toEqual([wheel]);
    expect(instanceCount(next, "car")).toBe(2);
  });
});

describe("freeSymbolName", () => {
  it("adds a number when the name is taken", () => {
    const { scene, group } = groupedScene();
    const withCar = replaceWithUse(scene, group.id, "car");

    expect(freeSymbolName(withCar, "car")).toBe("car-2");
  });
});
