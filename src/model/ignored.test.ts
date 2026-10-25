import { describe, expect, it } from "vitest";
import { goldenScenes } from "../test/golden-scenes.ts";
import { ignoredPaths } from "./ignored.ts";
import { parseScene } from "./schema.ts";

describe("ignoredPaths (063/R6)", () => {
  it("names a key the parsed value dropped by its full path", () => {
    // Arrange
    const input = {
      elements: [{ kind: "rect" }, { kind: "group", children: [{ glw: 1 }] }],
    };
    const parsed = {
      elements: [{ kind: "rect" }, { kind: "group", children: [{}] }],
    };

    // Act
    const paths = ignoredPaths(input, parsed);

    // Assert
    expect(paths).toEqual(["elements.1.children.0.glw"]);
  });

  it("finds nothing ignored in a scene that already parses cleanly", () => {
    // Arrange
    const scene = goldenScenes().kinds;
    const parsed = parseScene(scene);

    // Act
    const paths = parsed.ok ? ignoredPaths(scene, parsed.value) : ["unparsed"];

    // Assert
    expect(paths).toEqual([]);
  });
});
