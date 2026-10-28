import { describe, expect, it } from "vitest";
import { defaultRect, defaultScene } from "../model/model.ts";
import { groupElements, ungroupElement } from "./groups.ts";

const rect = (id: string, x: number) => ({ ...defaultRect(), id, x, y: 0 });
const ids = (scene: { elements: { id: string }[] }) =>
  scene.elements.map((el) => el.id);

describe("group order (081/R17)", () => {
  it("keeps the members' draw order whatever order the ids are given in", () => {
    // Arrange
    const scene = { ...defaultScene(), elements: [rect("r1", 0), rect("t1", 50)] };

    // Act
    const grouped = groupElements(scene, ["t1", "r1"], "g");
    const back = ungroupElement(grouped.scene, "g");

    // Assert
    expect(back.ids).toEqual(["r1", "t1"]);
  });

  it("puts a non-member between two members below the group", () => {
    // Arrange
    const scene = {
      ...defaultScene(),
      elements: [rect("a", 0), rect("x", 20), rect("b", 40)],
    };

    // Act
    const grouped = groupElements(scene, ["a", "b"], "g");

    // Assert
    expect(ids(grouped.scene)).toEqual(["x", "g"]);
  });
});
