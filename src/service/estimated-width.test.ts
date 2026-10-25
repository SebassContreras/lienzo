import { beforeEach, describe, expect, it } from "vitest";
import { type ToolHarness, toolHarness } from "../test/tool-harness.ts";

let ok: ToolHarness["ok"];

beforeEach(async () => {
  ({ ok } = await toolHarness());
});

const titleIn = (font: string) => ({
  elements: [
    { kind: "text", id: "title", text: "Hola mundo", font, at: "center" },
  ],
});

const estimatedNotice = (notices: unknown) =>
  (notices as string[]).filter((n) => n.includes("scene_preview"));

describe("estimated text widths (064/R4)", () => {
  it("warns in scene_build that a font with no metrics has an estimated width", async () => {
    // Act
    const built = await ok("scene_build", { compact: titleIn("Georgia") });

    // Assert
    expect(estimatedNotice(built.notices)).toEqual([
      expect.stringContaining("Georgia"),
    ]);
  });

  it("warns in scene_validate that a font with no metrics has an estimated width", async () => {
    // Arrange
    const built = await ok("scene_build", { compact: titleIn("Georgia") });

    // Act
    const verdict = await ok("scene_validate", { scene: built.scene });

    // Assert
    expect(estimatedNotice(verdict.notices)).toEqual([
      expect.stringContaining("Georgia"),
    ]);
  });

  it("marks the boxes of a text with an estimated width", async () => {
    // Arrange
    const built = await ok("scene_build", { compact: titleIn("Georgia") });

    // Act
    const layout = await ok("scene_inspect_layout", {
      scene: built.scene,
      times: [0],
    });

    // Assert
    expect(layout.boxes).toEqual([
      expect.objectContaining({ id: "title", estimated: true }),
    ]);
  });

  it("neither warns nor marks a text in a bundled font", async () => {
    // Arrange
    const built = await ok("scene_build", { compact: titleIn("Inter") });

    // Act
    const layout = await ok("scene_inspect_layout", {
      scene: built.scene,
      times: [0],
    });

    // Assert
    expect(estimatedNotice(built.notices)).toEqual([]);
    expect(layout.boxes).toEqual([
      expect.not.objectContaining({ estimated: true }),
    ]);
  });
});
