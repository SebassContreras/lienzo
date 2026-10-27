import { describe, expect, it } from "vitest";
import "../../components/index.ts";
import { CompactSceneSchema } from "../../model/compact.ts";
import { ElementSchema } from "../../model/element-schema.ts";
import { defaultRect, type Element } from "../../model/model.ts";
import { expandScene } from "./expand.ts";

type Shape = Extract<Element, { kind: "rect" }>;

const STOPS = [
  { at: 0, color: "#ff0000" },
  { at: 0.5, color: "#00ff00" },
  { at: 1, color: "#0000ff" },
];

/** The paths of the issues a compact scene holding only `el` fails with. */
function issuePaths(el: Record<string, unknown>): string[] {
  const r = CompactSceneSchema.safeParse({ elements: [el] });
  return r.success ? [] : r.error.issues.map((i) => i.path.join("."));
}

describe("compact gradient fills (059/R3)", () => {
  it("builds a rect with a radial multi-stop fill and keeps it", async () => {
    const { scene } = await expandScene({
      elements: [
        {
          kind: "rect",
          fill: { gradient: true, type: "radial", stops: STOPS },
        },
      ],
    });

    const fill = (scene.elements[0] as Shape).fill;
    expect([fill.type, fill.stops]).toEqual(["radial", STOPS]);
  });

  it("rejects a stop outside 0–1 at its path", () => {
    const bad = [
      { at: 0, color: "#000000" },
      { at: 1.5, color: "#ffffff" },
    ];

    expect(issuePaths({ kind: "rect", fill: { stops: bad } })).toContain(
      "elements.0.fill.stops.1.at",
    );
  });

  it("rejects a single stop", () => {
    const one = [{ at: 0, color: "#000000" }];

    expect(issuePaths({ kind: "rect", fill: { stops: one } })).toContain(
      "elements.0.fill.stops",
    );
  });

  it("rejects stops out of order (068/R1)", () => {
    const backwards = [
      { at: 0.8, color: "#000000" },
      { at: 0.2, color: "#ffffff" },
    ];

    expect(issuePaths({ kind: "rect", fill: { stops: backwards } })).toContain(
      "elements.0.fill.stops",
    );
  });

  it("a fill saved before 059 reads as linear with no stops (R4)", () => {
    const rect = defaultRect();
    const { type: _t, stops: _s, ...oldFill } = rect.fill;

    const parsed = ElementSchema.parse({ ...rect, fill: oldFill }) as Shape;

    expect([parsed.fill.type, parsed.fill.stops]).toEqual([
      "linear",
      undefined,
    ]);
  });
});
