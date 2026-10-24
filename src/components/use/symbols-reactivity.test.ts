import { describe, expect, it, vi } from "vitest";
import { rest } from "../../animations/index.ts";
import { defaultRect, defaultScene, type Scene } from "../../model/model.ts";
import { createElement } from "../index.ts";
import type { RectEl } from "../rect/descriptor.ts";
import type { UseEl } from "./descriptor.ts";
import { drawUse } from "./draw.ts";

describe("Symbol updates reactivity (056/T009 - R4, D5)", () => {
  it("updates appearance of all use instances when editing scene.symbols without duplicating elements", () => {
    // Single symbol definition referenced by two different use elements
    const scene: Scene = {
      ...defaultScene(),
      symbols: {
        car: {
          w: 200,
          h: 100,
          children: [
            {
              ...defaultRect(),
              id: "car-body",
              x: 0,
              y: 0,
              w: 200,
              h: 100,
              fill: { ...defaultRect().fill, color: "#3b82f6" }, // blue
            },
          ],
        },
      },
      elements: [
        {
          ...createElement("use"),
          id: "car-left",
          symbol: "car",
          x: 100,
          y: 100,
          w: 100,
          h: 50,
        } as UseEl,
        {
          ...createElement("use"),
          id: "car-right",
          symbol: "car",
          x: 400,
          y: 100,
          w: 100,
          h: 50,
        } as UseEl,
      ],
    };

    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    let drawnElementsLog: RectEl[] = [];
    const drawElementsMock = vi.fn((_ctx, elements) => {
      drawnElementsLog.push(...elements);
    });

    const drawContext = {
      scene,
      t: 0,
      byId: new Map(),
      drawElements: drawElementsMock,
    };

    // First render pass
    for (const el of scene.elements) {
      if (el.kind === "use") {
        drawUse(mockCtx, el as UseEl, rest(), drawContext);
      }
    }

    expect(drawElementsMock).toHaveBeenCalledTimes(2);
    expect(drawnElementsLog[0].fill.color).toBe("#3b82f6");
    expect(drawnElementsLog[1].fill.color).toBe("#3b82f6");

    // Edit the symbol definition in scene.symbols directly (R4: no elements duplication)
    const carSymbol = scene.symbols?.car;
    expect(carSymbol).toBeDefined();
    if (carSymbol) {
      (carSymbol.children[0] as RectEl).fill.color = "#ef4444"; // changed to red
    }
    drawnElementsLog = [];
    drawElementsMock.mockClear();

    // Second render pass
    for (const el of scene.elements) {
      if (el.kind === "use") {
        drawUse(mockCtx, el as UseEl, rest(), drawContext);
      }
    }

    // Both instances now reflect the updated symbol definition immediately
    expect(drawElementsMock).toHaveBeenCalledTimes(2);
    expect(drawnElementsLog[0].fill.color).toBe("#ef4444");
    expect(drawnElementsLog[1].fill.color).toBe("#ef4444");

    // Element count in the scene has not inflated or duplicated
    expect(scene.elements).toHaveLength(2);
    expect(scene.symbols?.car.children).toHaveLength(1);
  });
});
