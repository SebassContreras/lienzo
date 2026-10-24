import { describe, expect, it } from "vitest";
import { expandScene } from "../service/compact/expand.ts";
import { CompactSceneSchema } from "./compact.ts";
import {
  defaultEllipse,
  defaultRect,
  defaultScene,
  type Element,
} from "./model.ts";
import { parseScene } from "./schema.ts";

describe("Symbol schema and expansion (056/T006 - R1)", () => {
  it("validates canonical scene with symbols dictionary", () => {
    const scene = defaultScene();
    scene.symbols = {
      car: {
        w: 200,
        h: 100,
        children: [
          {
            ...defaultRect(),
            id: "chassis",
            x: 0,
            y: 20,
            w: 200,
            h: 60,
          },
          {
            ...defaultEllipse(),
            id: "wheel",
            x: 20,
            y: 70,
            w: 30,
            h: 30,
          },
        ],
      },
    };

    const parsed = parseScene(scene);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.symbols?.car).toBeDefined();
      expect(parsed.value.symbols?.car.w).toBe(200);
      expect(parsed.value.symbols?.car.children).toHaveLength(2);
    }
  });

  it("validates and expands compact scene with symbols", async () => {
    const compact = {
      size: "1080x1080",
      symbols: {
        house: {
          w: 300,
          h: 300,
          children: [
            {
              id: "roof",
              kind: "polygon",
              points: [
                [150, 0],
                [0, 100],
                [300, 100],
              ],
            },
            { id: "wall", kind: "rect", x: 20, y: 100, w: 260, h: 200 },
          ],
        },
      },
      elements: [
        {
          id: "village-house-1",
          kind: "use",
          symbol: "house",
          x: 100,
          y: 200,
          w: 150,
          h: 150,
        },
      ],
    };

    const parseResult = CompactSceneSchema.safeParse(compact);
    expect(parseResult.success).toBe(true);

    const { scene: expanded } = await expandScene(compact);
    expect(expanded.symbols).toBeDefined();
    expect(expanded.symbols?.house).toBeDefined();
    expect(expanded.symbols?.house.children).toHaveLength(2);
    expect(expanded.elements).toHaveLength(1);
    expect(expanded.elements[0].kind).toBe("use");
    expect(
      (expanded.elements[0] as Extract<Element, { kind: "use" }>).symbol,
    ).toBe("house");
  });

  it("rejects duplicate IDs inside compact symbol definitions", async () => {
    const compact = {
      symbols: {
        tree: {
          w: 100,
          h: 200,
          children: [
            { id: "branch", kind: "rect", w: 20, h: 20 },
            { id: "branch", kind: "rect", w: 30, h: 30 },
          ],
        },
      },
      elements: [],
    };

    await expect(expandScene(compact)).rejects.toThrow(/ID duplicado «branch»/);
  });
});
