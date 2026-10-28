import { describe, expect, it } from "vitest";
import { createElement } from "../../components/index.ts";
import type { UseEl } from "../../components/use/descriptor.ts";
import { defaultRect, defaultScene, type Scene } from "../../model/model.ts";
import { inspectLayout } from "./layout.ts";

describe("Layout inspection for symbols (056/T008 - R3)", () => {
  it("emits missing_symbol diagnostic when use element references unknown symbol", () => {
    const scene: Scene = {
      ...defaultScene(),
      elements: [
        {
          ...createElement("use"),
          id: "use-ghost",
          symbol: "phantom-icon",
          x: 100,
          y: 100,
          w: 100,
          h: 100,
        } as UseEl,
      ],
    };

    const diagnostics = inspectLayout(scene, [0]);
    const missing = diagnostics.find(
      (d) => d.code === "missing_symbol" && d.elementId === "use-ghost",
    );

    expect(missing).toBeDefined();
    expect(missing?.message).toContain("«phantom-icon» no existe en la escena");
  });

  it("emits missing_symbol diagnostic when use element has empty symbol name", () => {
    const scene: Scene = {
      ...defaultScene(),
      elements: [
        {
          ...createElement("use"),
          id: "use-empty",
          symbol: "",
          x: 50,
          y: 50,
          w: 80,
          h: 80,
        } as UseEl,
      ],
    };

    const diagnostics = inspectLayout(scene, [0]);
    const missing = diagnostics.find(
      (d) => d.code === "missing_symbol" && d.elementId === "use-empty",
    );

    expect(missing).toBeDefined();
    expect(missing?.message).toContain("no tiene ningún símbolo especificado");
  });

  it("produces no missing_symbol diagnostics when symbol is properly defined", () => {
    const scene: Scene = {
      ...defaultScene(),
      symbols: {
        avatar: {
          w: 100,
          h: 100,
          children: [
            {
              ...defaultRect(),
              id: "avatar-box",
              x: 0,
              y: 0,
              w: 100,
              h: 100,
            },
          ],
        },
      },
      elements: [
        {
          ...createElement("use"),
          id: "use-avatar",
          symbol: "avatar",
          x: 200,
          y: 200,
          w: 100,
          h: 100,
        } as UseEl,
      ],
    };

    const diagnostics = inspectLayout(scene, [0]);
    const missing = diagnostics.filter((d) => d.code === "missing_symbol");
    expect(missing).toHaveLength(0);
  });
});
