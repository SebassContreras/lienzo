import { beforeEach, describe, expect, it } from "vitest";
import { type ToolHarness, toolHarness } from "../../test/tool-harness.ts";

let h: ToolHarness;

beforeEach(async () => {
  h = await toolHarness();
});

const ok = (name: string, input: unknown) => h.ok(name, input);

describe("ignored fields", () => {
  it("warns about a misspelled element key in scene_build", async () => {
    // Arrange
    const compact = { elements: [{ kind: "rect" }, { kind: "rect", glw: 4 }] };

    // Act
    const res = await ok("scene_build", { compact });

    // Assert
    expect(res.notices).toEqual([
      "Campo desconocido ignorado: compact.elements.1.glw",
    ]);
  });

  it("warns about a misspelled element key in scene_validate", async () => {
    // Arrange
    const { scene } = await ok("scene_build", {
      compact: { elements: [{ kind: "rect" }] },
    });
    const typo = scene as { elements: Record<string, unknown>[] };
    typo.elements[0] = { ...typo.elements[0], glw: 4 };

    // Act
    const res = await ok("scene_validate", { data: typo });

    // Assert
    // the data names its element by id, so the notice does (080/R6)
    expect(res).toEqual({
      valid: true,
      notices: [
        `Campo desconocido ignorado: elements.${typo.elements[0]?.id}.glw`,
      ],
    });
  });

  it("warns about a misspelled compact key in scene_validate, naming the field it means (067/R3)", async () => {
    // Arrange
    const compact = {
      elements: [{ kind: "text", text: "Hola", fontSize: 40 }],
    };

    // Act
    const res = await ok("scene_validate", { compact });

    // Assert
    expect(res).toEqual({
      valid: true,
      notices: [
        "Campo desconocido ignorado: compact.elements.0.fontSize (¿quisiste decir «size»?)",
      ],
    });
  });
});
