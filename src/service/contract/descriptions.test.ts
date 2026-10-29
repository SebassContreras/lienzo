import { describe, expect, it } from "vitest";
import { sceneInspectLayout } from "../layout/tools/scene-inspect-layout.ts";
import { presetValidate } from "../presets/tools/preset-validate.ts";
import { sceneBuild } from "../scenes/tools/scene-build.ts";
import { sceneCreate } from "../scenes/tools/scene-create.ts";
import { shotSet } from "../shots/tools/shot-set.ts";

describe("tool descriptions", () => {
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

  it("tells scene_build the sizes it takes and the two animation models", () => {
    // Act
    const text = sceneBuild.description;

    // Assert
    expect(text).toContain('"9:16"');
    expect(text).toContain('anim: "fade"');
  });

  it("tells preset_validate what a recipe holds", () => {
    // Act
    const text = presetValidate.description;

    // Assert
    expect(text).toContain("`{ name, kind, category?, traits?, set? }`");
  });
});

describe("what a QA agent would take for a bug", () => {
  it("tells scene_create that a key the scene lacks is dropped with a notice, and where `at` goes", () => {
    expect(sceneCreate.description).toContain("dropped with a notice");
    expect(sceneCreate.description).toContain(
      "scene_build, element_add and element_update",
    );
  });

  it("tells shot_set that shots need not touch and what removing one does to a key before 0", () => {
    expect(shotSet.description).toContain("a gap between them gets no notice");
    expect(shotSet.description).toContain("stays at 0");
  });

  it("tells scene_inspect_layout what its overlap checks leave out and why a box can be empty", () => {
    const text = sceneInspectLayout.description;
    expect(text).toContain("text elements against each other only");
    expect(text).toContain("never a text, line or group");
    expect(text).toContain("`0 x 0`");
  });
});

describe("closed sets in descriptions", () => {
  it("lists animation kinds, easings and transitions in shot_set", () => {
    expect(shotSet.description).toContain("`fade`");
    expect(shotSet.description).toContain("`ease-out`");
    expect(shotSet.description).toContain("`slide`");
  });

  it("lists the loop kinds in scene_build", () => {
    expect(sceneBuild.description).toContain("`float`");
  });
});
