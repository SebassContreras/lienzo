import { beforeEach, describe, expect, it } from "vitest";
import { type ToolHarness, toolHarness } from "../../test/tool-harness.ts";

let ok: ToolHarness["ok"];

beforeEach(async () => {
  ({ ok } = await toolHarness());
});

const withUnknownField = {
  elements: [{ kind: "rect", id: "card", glw: 3 }],
  audioTracks: [],
};

describe("scene_build notices (064/R5)", () => {
  it("names the saved scene in `saved`", async () => {
    // Act
    const res = await ok("scene_build", {
      compact: withUnknownField,
      save: "demo",
    });

    // Assert
    expect(res.saved).toBe("demo");
  });

  it("lists every notice of a saving build once, in one list", async () => {
    // Arrange
    const compact = {
      elements: [{ kind: "text", id: "title", font: "Montserrat", glw: 3 }],
    };

    // Act
    const res = await ok("scene_build", { compact, save: "demo" });

    // Assert
    expect(res.notices).toEqual([
      "Campo desconocido ignorado: compact.elements.0.glw",
      expect.stringContaining("«Montserrat» no está instalada"),
      expect.stringContaining("«Montserrat» es una estimación"),
    ]);
  });
});

const twoCards = {
  elements: [
    { kind: "rect", id: "a" },
    { kind: "group", id: "b", children: [{ kind: "ellipse", id: "b1" }] },
  ],
};

describe("scene_build concise result (064/R6)", () => {
  it("returns no scene and the top-level elements when it saves", async () => {
    // Act
    const res = await ok("scene_build", { compact: twoCards, save: "demo" });

    // Assert
    expect(res).not.toHaveProperty("scene");
    expect(res.elements).toEqual([
      { id: "a", kind: "rect" },
      { id: "b", kind: "group" },
    ]);
  });

  it("returns the scene when a saving build asks for detailed", async () => {
    // Act
    const res = await ok("scene_build", {
      compact: twoCards,
      save: "demo",
      response_format: "detailed",
    });

    // Assert
    expect(res.scene).toMatchObject({ elements: [{ id: "a" }, { id: "b" }] });
  });

  it("returns the scene when it does not save", async () => {
    // Act
    const res = await ok("scene_build", { compact: twoCards });

    // Assert
    expect(res.scene).toMatchObject({ elements: [{ id: "a" }, { id: "b" }] });
  });
});
