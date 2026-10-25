import { beforeEach, describe, expect, it } from "vitest";
import { type ToolHarness, toolHarness } from "../../test/tool-harness.ts";

let call: ToolHarness["call"];
let ok: ToolHarness["ok"];

beforeEach(async () => {
  ({ call, ok } = await toolHarness());
});

describe("scene_validate takes a compact scene (064/R10)", () => {
  it("gives the notices scene_build gives", async () => {
    // Arrange
    const compact = { background: "notacolor", elements: [] };

    // Act
    const built = await ok("scene_build", { compact });
    const checked = await ok("scene_validate", { compact });

    // Assert
    expect(checked).toEqual({ valid: true, notices: built.notices });
  });

  it("fails when both or neither input is given", async () => {
    // Act
    const both = await ok("scene_validate", {
      data: {},
      compact: { elements: [] },
    });
    const neither = await ok("scene_validate", {});

    // Assert
    expect(both).toMatchObject({ valid: false, path: "compact" });
    expect(neither).toMatchObject({ valid: false, path: "compact" });
  });
});

describe("`at` is the same in every tool (064/R11)", () => {
  const rect = { kind: "rect", w: 200, h: 100 };
  const built = async (at: unknown) => {
    const res = await ok("scene_build", {
      compact: { elements: [{ id: "r", ...rect, at }] },
    });
    return (res.scene as { elements: { x: number; y: number }[] }).elements[0];
  };
  const stored = async () => {
    const res = await ok("scene_get", { scene: "s" });
    const scene = (res.scene ?? res) as {
      elements: { x: number; y: number }[];
    };
    return scene.elements[0];
  };

  it("centres on a point in scene_build", async () => {
    // Act
    const el = await built({ x: 300, y: 400 });

    // Assert
    expect(el).toMatchObject({ x: 200, y: 350 });
  });

  it.each(["center", "bottom-right", { anchor: "top", offset: [10, 20] }])(
    "places %j in element_add and element_update as scene_build",
    async (at) => {
      // Arrange
      const expected = await built(at);
      await ok("scene_create", { scene: "s" });

      // Act
      const { id } = await ok("element_add", {
        scene: "s",
        kind: "rect",
        patch: { w: 200, h: 100 },
        at,
      });
      const added = await stored();
      await ok("element_update", {
        scene: "s",
        id,
        patch: {},
        at: { x: 0, y: 0 },
      });
      await ok("element_update", { scene: "s", id, patch: {}, at });
      const updated = await stored();

      // Assert
      expect(added).toMatchObject({ x: expected.x, y: expected.y });
      expect(updated).toMatchObject({ x: expected.x, y: expected.y });
    },
  );

  it("lists the three forms on a bad value", async () => {
    // Act
    const r = await call("scene_build", {
      compact: { elements: [{ kind: "text", at: [10, 20] }] },
    });

    // Assert
    expect(r.ok).toBe(false);
    const message = r.ok ? "" : r.error.message;
    expect(message).toContain("center");
    expect(message).toContain("anchor");
    expect(message).toContain("{ x, y }");
    expect(message).not.toContain("Invalid input");
  });
});
