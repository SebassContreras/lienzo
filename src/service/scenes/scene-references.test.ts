import { describe, expect, it } from "vitest";
import { createElement } from "../../components/index.ts";
import { defaultScene, type Element, type Scene } from "../../model/model.ts";
import { danglingReferences } from "./scene-references.ts";

const el = (kind: string, fields: Record<string, unknown>) =>
  ({ ...createElement(kind as "rect"), ...fields }) as Element;

const scene = (over: Partial<Scene>): Scene => ({ ...defaultScene(), ...over });

describe("danglingReferences", () => {
  it("names each kind of missing reference by its code and path", () => {
    const found = danglingReferences(
      scene({
        elements: [
          el("rect", { id: "r", shot: "nope" }),
          el("use", { id: "u", symbol: "falta" }),
          el("icon", { id: "i", icon: "Wrenchh" }),
        ],
      }),
    );
    expect(found.map(({ code, path }) => [code, path])).toEqual([
      ["unknown_shot", "elements.0.shot"],
      ["unknown_symbol", "elements.1.symbol"],
      ["unknown_icon", "elements.2.icon"],
    ]);
  });

  it("an override may name any child of the symbol, inside a group too, or a child's index", () => {
    const symbols = {
      chip: {
        w: 10,
        h: 10,
        children: [
          el("group", { id: "g", children: [el("ellipse", { id: "d" })] }),
        ],
      },
    } as unknown as Scene["symbols"];
    const use = (overrides: Record<string, unknown>) =>
      danglingReferences(
        scene({
          symbols,
          elements: [el("use", { id: "u", symbol: "chip", overrides })],
        }),
      );
    expect(use({ g: {}, d: { fill: "red" }, "0.0": {} })).toEqual([]);
    expect(use({ x: {} })).toEqual([
      expect.objectContaining({
        code: "unknown_override",
        path: "elements.0.overrides.x",
        message: "El símbolo «chip» no tiene el elemento «x» (ids: «g», «d»)",
      }),
    ]);
  });
});
