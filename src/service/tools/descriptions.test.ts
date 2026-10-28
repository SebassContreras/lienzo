import { describe, expect, it } from "vitest";
import { sceneBuild } from "../scenes/tools/scene-build.ts";
import { shotSet } from "../shots/tools/shot-set.ts";
import { presetValidate } from "./preset-validate.ts";

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

  it("tells scene_build the sizes it takes and the two animation models (074/R14)", () => {
    // Act
    const text = sceneBuild.description;

    // Assert
    expect(text).toContain('"9:16"');
    expect(text).toContain('anim: "fade"');
  });

  it("tells preset_validate what a recipe holds (074/R14)", () => {
    // Act
    const text = presetValidate.description;

    // Assert
    expect(text).toContain("`{ name, kind, category?, traits?, set? }`");
  });
});

describe("closed sets in descriptions (081/R13)", () => {
  it("lists animation kinds, easings and transitions in shot_set", () => {
    expect(shotSet.description).toContain("`fade`");
    expect(shotSet.description).toContain("`ease-out`");
    expect(shotSet.description).toContain("`slide`");
  });

  it("lists the loop kinds in scene_build", () => {
    expect(sceneBuild.description).toContain("`float`");
  });
});
