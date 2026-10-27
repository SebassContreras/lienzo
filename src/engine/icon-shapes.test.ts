import { describe, expect, it } from "vitest";
import { installCanvasFakes } from "../test/recording-ctx.ts";

installCanvasFakes();
const { iconPaths, iconSet } = await import("./icon-shapes.ts");

describe("iconPaths", () => {
  it("draws nothing while the icon set loads, then the icon once it has", async () => {
    const before = iconPaths("Star");

    await iconSet.load();

    expect(before).toEqual([]);
    expect(iconPaths("Star").length).toBeGreaterThan(0);
  });
});
