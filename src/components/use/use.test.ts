import { describe, expect, it, vi } from "vitest";
import { rest } from "../../animations/index.ts";
import type { Element, Scene } from "../../model/model.ts";
import { defaultRect, defaultScene } from "../../model/model.ts";
import { createElement, descriptorOf } from "../index.ts";
import type { RectEl } from "../rect/descriptor.ts";
import type { UseEl } from "./descriptor.ts";
import { drawUse, instantiateSymbolElements } from "./draw.ts";

describe("Use component & drawing (056/T007 - R2, R3)", () => {
  it("registers `use` component descriptor with appropriate defaults", () => {
    const desc = descriptorOf("use");
    expect(desc).toBeDefined();
    expect(desc?.kind).toBe("use");
    expect(desc?.label).toBe("Símbolo");

    const el = createElement("use") as UseEl;
    expect(el.kind).toBe("use");
    expect(el.symbol).toBe("");
    expect(el.w).toBe(100);
    expect(el.h).toBe(100);
    expect(el.overrides).toEqual({});
  });

  it("applies overrides to symbol elements by element ID and index path", () => {
    const elements: Element[] = [
      {
        ...defaultRect(),
        id: "rect-1",
        name: "Box",
        fill: { ...defaultRect().fill, color: "#111111" },
      },
      {
        ...defaultRect(),
        id: "rect-2",
        name: "Second Box",
        fill: { ...defaultRect().fill, color: "#222222" },
      },
    ];

    const overrides = {
      "rect-1": {
        fill: { color: "#ff0000" },
      },
      "1": {
        name: "Overridden by index",
      },
    };

    const instantiated = instantiateSymbolElements(elements, overrides);
    expect((instantiated[0] as RectEl).fill.color).toBe("#ff0000");
    expect(instantiated[1].name).toBe("Overridden by index");
    expect((instantiated[1] as RectEl).fill.color).toBe("#222222");

    // Pure function: original elements remain untouched
    expect((elements[0] as RectEl).fill.color).toBe("#111111");
  });

  it("draws instantiated symbol scaled to use element box", () => {
    const scene: Scene = {
      ...defaultScene(),
      symbols: {
        badge: {
          w: 200,
          h: 200,
          children: [
            {
              ...defaultRect(),
              id: "inner-badge",
              x: 0,
              y: 0,
              w: 200,
              h: 200,
            },
          ],
        },
      },
    };

    const useEl: UseEl = {
      ...createElement("use"),
      symbol: "badge",
      x: 50,
      y: 50,
      w: 100,
      h: 100,
      overrides: {
        "inner-badge": {
          fill: { color: "#00ff00" },
        },
      },
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
    } as any;

    const drawElementsMock = vi.fn();

    drawUse(mockCtx, useEl, rest(), {
      scene,
      t: 0,
      byId: new Map(),
      drawElements: drawElementsMock,
    });

    // Scaling from 200x200 symbol to 100x100 instance -> scale(0.5, 0.5)
    expect(mockCtx.scale).toHaveBeenCalledWith(0.5, 0.5);
    expect(drawElementsMock).toHaveBeenCalledTimes(1);

    const passedElements = drawElementsMock.mock.calls[0][1];
    expect(passedElements[0].id).toBe("inner-badge");
    expect(passedElements[0].fill.color).toBe("#00ff00");
  });

  it("draws non-crashing placeholder when symbol is missing", () => {
    const scene = defaultScene();
    const useEl: UseEl = {
      ...createElement("use"),
      symbol: "nonexistent",
      x: 10,
      y: 10,
      w: 150,
      h: 80,
    };

    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      strokeRect: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
    } as any;

    const drawElementsMock = vi.fn();

    expect(() =>
      drawUse(mockCtx, useEl, rest(), {
        scene,
        t: 0,
        byId: new Map(),
        drawElements: drawElementsMock,
      }),
    ).not.toThrow();

    expect(drawElementsMock).not.toHaveBeenCalled();
    expect(mockCtx.strokeRect).toHaveBeenCalledWith(10, 10, 150, 80);
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      expect.stringContaining('Symbol "nonexistent" not found'),
      expect.any(Number),
      expect.any(Number),
    );
  });
});
