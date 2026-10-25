import { describe, expect, it } from "vitest";
import { sceneBuild } from "./scene-build.ts";
import { shotSet } from "./shot-set.ts";

describe("tool descriptions (064/R2, R3)", () => {
  it("tells shot_set when a transition runs and what the camera moves", () => {
    // Act
    const text = shotSet.description;

    // Assert
    expect(text).toContain("before its `start`");
    expect(text).toContain("after its `end`");
    expect(text).toContain("only the elements bound to that shot");
  });

  it("tells scene_build when a transition runs and what the camera moves", () => {
    // Act
    const text = sceneBuild.description;

    // Assert
    expect(text).toContain("before its `start`");
    expect(text).toContain("only the elements bound to that shot");
  });

  it("names every kind and look that flat changes in scene_build", () => {
    // Act
    const text = sceneBuild.description;

    // Assert
    expect(text).toContain("rect, ellipse, polygon, star, arrow, path");
    expect(text).toContain("gradient, shadow, border and border glow");
  });
});
