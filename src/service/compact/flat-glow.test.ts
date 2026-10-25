import { describe, expect, it } from "vitest";
import "../../components/index.ts";
import type { PathEl } from "../../components/path/descriptor.ts";
import type { RectEl } from "../../components/rect/descriptor.ts";
import type { CompactScene } from "../../model/compact.ts";
import { expandScene } from "./expand.ts";

async function firstElement(compact: CompactScene) {
  const { scene } = await expandScene(compact);
  return scene.elements[0];
}

describe("flat border glow (064/R1)", () => {
  it("turns off the border glow of a flat rect with a border", async () => {
    // Arrange
    const compact: CompactScene = {
      defaults: "flat",
      elements: [{ kind: "rect", border: { width: 20 } }],
    };

    // Act
    const rect = (await firstElement(compact)) as RectEl;

    // Assert
    expect(rect.borderGlow.enabled).toBe(false);
  });

  it("lets a border glow written on a flat path win", async () => {
    // Arrange
    const compact: CompactScene = {
      defaults: "flat",
      elements: [{ kind: "path", borderGlow: { enabled: true } }],
    };

    // Act
    const path = (await firstElement(compact)) as PathEl;

    // Assert
    expect(path.borderGlow.enabled).toBe(true);
  });

  it("turns off the border glow of every flat shape", async () => {
    // Arrange
    const compact: CompactScene = {
      defaults: "flat",
      elements: [{ kind: "ellipse" }],
    };

    // Act
    const ellipse = (await firstElement(compact)) as RectEl;

    // Assert
    expect(ellipse.borderGlow.enabled).toBe(false);
  });

  it("lets a border glow written on a flat rect win", async () => {
    // Arrange
    const compact: CompactScene = {
      defaults: "flat",
      elements: [{ kind: "rect", borderGlow: { enabled: true } }],
    };

    // Act
    const rect = (await firstElement(compact)) as RectEl;

    // Assert
    expect(rect.borderGlow.enabled).toBe(true);
  });
});
