import { beforeEach, describe, expect, it } from "vitest";
import { type ToolHarness, toolHarness } from "../../test/tool-harness.ts";

let ok: ToolHarness["ok"];

beforeEach(async () => {
  ({ ok } = await toolHarness());
});

const build = (background: string) =>
  ok("scene_build", { compact: { background, elements: [] } });

describe("compact background strings (064/R8)", () => {
  it("makes a solid background from a color", async () => {
    // Act
    const res = await build("#111827");

    // Assert
    expect(res.scene).toMatchObject({
      background: {
        color: "#111827",
        gradient: false,
        dots: false,
        spotlight: 0,
      },
    });
  });

  it("names an unknown background in a notice and keeps the default", async () => {
    // Act
    const res = await build("fondo-que-no-existe");

    // Assert
    expect(res.notices).toEqual([
      expect.stringContaining("«fondo-que-no-existe»"),
    ]);
    expect(res.scene).toMatchObject({
      background: { color: "#0a1430", dots: true },
    });
  });

  it("still applies a background preset by name", async () => {
    // Act
    const res = await build("Negro liso");

    // Assert
    expect(res.scene).toMatchObject({
      background: { color: "#000000", gradient: false },
    });
    expect(res.notices).toEqual([]);
  });
});
