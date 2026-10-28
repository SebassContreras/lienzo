import { describe, expect, it } from "vitest";
import type { PathEl } from "../../components/path/descriptor.ts";
import type { RectEl } from "../../components/rect/descriptor.ts";
import type { CompactScene } from "../../model/compact.ts";
import { expandScene } from "./expand.ts";

async function firstElement(compact: CompactScene) {
  const { scene } = await expandScene(compact);
  return scene.elements[0];
}

describe("engine-wide defaults", () => {
  it("fills a new shape fully opaque", async () => {
    // Arrange
    const compact: CompactScene = { elements: [{ kind: "rect" }] };

    // Act
    const rect = (await firstElement(compact)) as RectEl;

    // Assert
    expect(rect.fill.opacity).toBe(1);
  });

  it("gives a new path no stroke", async () => {
    // Arrange
    const compact: CompactScene = { elements: [{ kind: "path" }] };

    // Act
    const path = (await firstElement(compact)) as PathEl;

    // Assert
    expect(path.border.width).toBe(0);
  });

  it("keeps a flat path without stroke", async () => {
    // Arrange
    const compact: CompactScene = {
      defaults: "flat",
      elements: [{ kind: "path" }],
    };

    // Act
    const path = (await firstElement(compact)) as PathEl;

    // Assert
    expect(path.border.width).toBe(0);
  });

  it("gives a path that draws itself on a visible stroke", async () => {
    // Arrange
    const compact: CompactScene = {
      elements: [{ kind: "path", anim: { in: "draw" } }],
    };

    // Act
    const path = (await firstElement(compact)) as PathEl;

    // Assert
    expect(path.border.width).toBe(3);
  });

  it("keeps an explicit zero stroke on a path that draws itself on", async () => {
    // Arrange
    const compact: CompactScene = {
      elements: [{ kind: "path", anim: { in: "draw" }, border: { width: 0 } }],
    };

    // Act
    const path = (await firstElement(compact)) as PathEl;

    // Assert
    expect(path.border.width).toBe(0);
  });
});
