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

  describe("line attachment target container scoping (093/R2)", () => {
    const symbolWithChild = {
      solardrop: {
        w: 100,
        h: 100,
        children: [el("rect", { id: "drop-shade" }), el("rect", { id: "drop-core" })],
      },
    } as unknown as Scene["symbols"];

    const cases: [
      string,
      {
        sceneElements: Element[];
        symbols?: Scene["symbols"];
      },
      {
        expectedCodes: string[];
        expectedPaths: string[];
        expectedIdSubstrings?: string[];
        forbiddenIdSubstrings?: string[];
      },
    ][] = [
      [
        "scene-level line attached to scene element",
        {
          sceneElements: [
            el("rect", { id: "s1-orb-a" }),
            el("line", { id: "l1", a: { attach: "s1-orb-a" } }),
          ],
        },
        { expectedCodes: [], expectedPaths: [] },
      ],
      [
        "scene-level line attached to symbol child rejected with unknown_target",
        {
          symbols: symbolWithChild,
          sceneElements: [
            el("rect", { id: "box" }),
            el("line", { id: "l1", a: { attach: "drop-shade" } }),
          ],
        },
        {
          expectedCodes: ["unknown_target"],
          expectedPaths: ["elements.1.a.attach"],
          forbiddenIdSubstrings: ["drop-shade"],
          expectedIdSubstrings: ["box"],
        },
      ],
      [
        "symbol-internal line attached to sibling child is valid",
        {
          symbols: {
            solardrop: {
              w: 100,
              h: 100,
              children: [
                el("rect", { id: "drop-shade" }),
                el("line", { id: "l1", a: { attach: "drop-shade" } }),
              ],
            },
          } as unknown as Scene["symbols"],
          sceneElements: [],
        },
        { expectedCodes: [], expectedPaths: [] },
      ],
      [
        "symbol-internal line attached to scene element rejected with unknown_target",
        {
          symbols: {
            solardrop: {
              w: 100,
              h: 100,
              children: [
                el("rect", { id: "drop-core" }),
                el("line", { id: "l1", a: { attach: "scene-box" } }),
              ],
            },
          } as unknown as Scene["symbols"],
          sceneElements: [el("rect", { id: "scene-box" })],
        },
        {
          expectedCodes: ["unknown_target"],
          expectedPaths: ["symbols.solardrop.children.1.a.attach"],
          forbiddenIdSubstrings: ["scene-box"],
          expectedIdSubstrings: ["drop-core"],
        },
      ],
      [
        "compound dangling attachments on both endpoints across containers",
        {
          symbols: symbolWithChild,
          sceneElements: [
            el("line", {
              id: "l1",
              a: { attach: "drop-shade" },
              b: { attach: "nonexistent" },
            }),
          ],
        },
        {
          expectedCodes: ["unknown_target", "unknown_target"],
          expectedPaths: ["elements.0.a.attach", "elements.0.b.attach"],
          forbiddenIdSubstrings: ["drop-shade"],
        },
      ],
    ];

    it.each(cases)(
      "%s",
      (
        _name,
        { sceneElements, symbols },
        { expectedCodes, expectedPaths, expectedIdSubstrings, forbiddenIdSubstrings },
      ) => {
        const sc = scene({ elements: sceneElements, symbols });
        const found = danglingReferences(sc);
        const codes = found.map((f) => f.code);
        const paths = found.map((f) => f.path);

        expect(codes).toEqual(expectedCodes);
        expect(paths).toEqual(expectedPaths);

        for (const err of found) {
          const idsListMatch = /ids: ([^)]+)/.exec(err.message);
          const idsList = idsListMatch ? idsListMatch[1] : "";
          if (expectedIdSubstrings) {
            for (const sub of expectedIdSubstrings) {
              expect(idsList).toContain(sub);
            }
          }
          if (forbiddenIdSubstrings) {
            for (const sub of forbiddenIdSubstrings) {
              expect(idsList).not.toContain(sub);
            }
          }
        }
      },
    );
  });
});
