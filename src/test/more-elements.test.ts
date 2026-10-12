import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { installCanvasFakes, RecordingCtx } from "./recording-ctx.ts";

installCanvasFakes();
const { createElement } = await import("../components/index.ts");
const { defaultScene } = await import("../model/model.ts");
const { parseScene } = await import("../model/schema.ts");
const { drawScene } = await import("../engine/render.ts");
const { BUILT_IN_RECIPES } = await import("../presets/recipes.ts");
const { tokenize } = await import("../components/code/tokenize.ts");
const { typedLines } = await import("../components/code/draw.ts");
const { parseData } = await import("../components/chart/draw.ts");
const { rowsOf } = await import("../components/table/draw.ts");
const { litness } = await import("../components/steps/draw.ts");
const { rowAlpha } = await import("../engine/reveal.ts");
const { placeChild } = await import("../engine/geometry.ts");

type Ctx = import("../engine/paint.ts").Ctx;
type Element = import("../model/model.ts").Element;

/** The value each new kind animates (017/D2); polygon, star, arrow and badge have none. */
const ANIMATED: Record<string, string> = {
  progress: "value",
  counter: "progress",
  steps: "active",
  list: "reveal",
  table: "reveal",
  code: "typed",
  chart: "progress",
};

const NEW_KINDS = [
  "polygon",
  "star",
  "arrow",
  "badge",
  "progress",
  "counter",
  "bubble",
  "steps",
  "list",
  "table",
  "code",
  "chart",
] as const;

function hashAt(el: Element, t: number): string {
  const ctx = new RecordingCtx();
  drawScene(ctx as unknown as Ctx, { ...defaultScene(), elements: [el] }, t);
  return createHash("sha256").update(ctx.log.join("\n")).digest("hex");
}

describe("new components (R1–R10)", () => {
  it.each(NEW_KINDS)("«%s» validates, draws the same at the same t", (kind) => {
    const el = createElement(kind);
    expect(parseScene({ ...defaultScene(), elements: [el] }).ok).toBe(true);
    expect(hashAt(el, 1.3)).toBe(hashAt(el, 1.3));
  });

  it.each(Object.entries(ANIMATED))(
    "«%s» animates «%s» with keyframes",
    (kind, path) => {
      const el = {
        ...(createElement(kind as never) as Element),
        tracks: {
          [path]: [
            { t: 0, value: 0, easing: "linear" },
            {
              t: 2,
              value: path === "value" ? 100 : path === "active" ? 4 : 1,
              easing: "linear",
            },
          ],
        },
      } as Element;
      expect(parseScene({ ...defaultScene(), elements: [el] }).ok).toBe(true);
      expect(hashAt(el, 0)).not.toBe(hashAt(el, 2));
      expect(hashAt(el, 1)).not.toBe(hashAt(el, 2));
    },
  );

  it("has a built-in preset for every new component (R13)", () => {
    const kinds = new Set(BUILT_IN_RECIPES.map((r) => r.kind));
    for (const kind of NEW_KINDS) expect(kinds).toContain(kind);
    const frames = BUILT_IN_RECIPES.map(
      (r) => (r.set as Record<string, unknown> | undefined)?.frame,
    );
    for (const f of ["browser", "terminal", "phone"])
      expect(frames).toContain(f);
  });
});

describe("pure parts", () => {
  it("tokenizes without losing a character, and highlights by language", () => {
    const code = 'const x = "hi"; // ok\nfoo(42)';
    const toks = tokenize(code, "js");
    expect(toks.map((t) => t.text).join("")).toBe(code);
    expect(toks).toContainEqual({ type: "keyword", text: "const" });
    expect(toks).toContainEqual({ type: "string", text: '"hi"' });
    expect(toks).toContainEqual({ type: "comment", text: "// ok" });
    expect(toks).toContainEqual({ type: "function", text: "foo" });
    expect(toks).toContainEqual({ type: "number", text: "42" });
    expect(tokenize("constant", "js")).toEqual([
      { type: "plain", text: "constant" },
    ]);
    expect(tokenize("def f(): pass", "python")[0]).toEqual({
      type: "keyword",
      text: "def",
    });
  });

  it("types code character by character across lines", () => {
    const toks = tokenize("ab\ncd", "js");
    expect(
      typedLines(toks, 4).map((l) => l.map((t) => t.text).join("")),
    ).toEqual(["ab", "c"]);
    expect(typedLines(toks, 0)).toEqual([[]]);
  });

  it("parses chart data and table rows", () => {
    expect(parseData("A: 1\nB: 2.5\n\nC")).toEqual([
      { label: "A", value: 1 },
      { label: "B", value: 2.5 },
      { label: "", value: 0 },
    ]);
    expect(rowsOf("a | b\n c|d ")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("lights steps and reveals rows in turn", () => {
    expect([0, 1, 2].map((i) => litness(1.5, i))).toEqual([1, 0.5, 0]);
    expect([0, 1, 2, 3].map((i) => rowAlpha(0.5, i, 4))).toEqual([1, 1, 0, 0]);
  });

  it("places a window's children in its body, below the title bar (R7)", () => {
    const child = { ...createElement("rect"), x: 0, y: 0, w: 100, h: 100 };
    const group = {
      ...createElement("group"),
      x: 0,
      y: 0,
      w: 400,
      h: 300,
      cw: 400,
      ch: 260,
      children: [child],
    };
    const bare = placeChild(child, group) as typeof child;
    expect(bare.y).toBe(0);
    const framed = placeChild(child, {
      ...group,
      frame: "browser",
    }) as typeof child;
    expect(framed.y).toBeGreaterThan(0);
    expect(framed.y + framed.h * 2.6).toBeCloseTo(300, 6);
  });
});
