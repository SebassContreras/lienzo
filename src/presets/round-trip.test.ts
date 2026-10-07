import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  cloneElement,
  defaultEllipse,
  defaultGroup,
  defaultLine,
  defaultRect,
  defaultText,
  type Element,
  type GroupEl,
  type RectEl,
} from "../model/model.ts";
import type { PresetRecipe } from "../model/preset.ts";
import { TRAITS } from "../traits/index.ts";
import { recipeFromElement } from "./diff.ts";
import { BUILT_IN_BACKGROUNDS, BUILT_IN_RECIPES } from "./recipes.ts";
import { resolveElement } from "./resolve.ts";
import { asRecipe } from "./store.ts";

function resolved(recipe: PresetRecipe): Element {
  const r = resolveElement(recipe);
  if ("error" in r) throw new Error(r.error);
  return r.element;
}

/** `el` with its id removed and the ids inside it replaced by their order, attachments too. */
function withoutId(el: Element): Record<string, unknown> {
  const order = new Map<string, string>();
  const number = (e: Element) => {
    order.set(e.id, `#${order.size}`);
    if (e.kind === "group") e.children.forEach(number);
  };
  number(el);
  const { id: _id, ...rest } = el;
  return JSON.parse(
    JSON.stringify(rest, (key, value) =>
      (key === "id" || key === "attach") && typeof value === "string"
        ? (order.get(value) ?? value)
        : value,
    ),
  );
}

describe("save as preset", () => {
  it.each(BUILT_IN_RECIPES.map((r) => [r.name, r] as const))(
    "«%s» round-trips through a saved recipe",
    (_name, recipe) => {
      const el = resolved(recipe);
      el.name = "Mío";
      const saved = recipeFromElement("Mío", el);
      expect(saved.traits).toEqual([]);
      expect(JSON.stringify(saved)).not.toContain(el.id);
      expect(withoutId(resolved(saved))).toEqual(withoutId(el));
    },
  );

  it("stores only what differs from the kind's default", () => {
    const el = resolved({ name: "x", kind: "rect", traits: [] }) as RectEl;
    el.w = 999;
    el.border.color = "#ff0000";
    expect(recipeFromElement("x", el)).toEqual({
      name: "x",
      kind: "rect",
      traits: [],
      set: { w: 999, border: { color: "#ff0000" } },
    });
    expect(
      recipeFromElement("y", resolved({ name: "y", kind: "text", traits: [] })),
    ).toEqual({
      name: "y",
      kind: "text",
      traits: [],
    });
  });

  it("an old whole-element preset file loads as a recipe", () => {
    const el = resolved(BUILT_IN_RECIPES[0] as PresetRecipe);
    const recipe = asRecipe({ name: "Viejo", element: el });
    expect(withoutId(resolved(recipe))).toEqual({
      ...withoutId(el),
      name: el.name,
    });
  });
});

describe("group presets", () => {
  function card(): GroupEl {
    const tile = { ...defaultRect(), x: 0, y: 0, w: 200, h: 120 };
    const dot = { ...defaultEllipse(), x: 20, y: 20, w: 30, h: 30 };
    const title = { ...defaultText(), x: 60, y: 20, text: "Hola" };
    const link = {
      ...defaultLine(),
      a: { x: 0, y: 0, attach: dot.id },
      b: { x: 0, y: 0, attach: title.id },
    };
    const inner = {
      ...defaultGroup(),
      x: 10,
      y: 80,
      children: [{ ...defaultRect(), w: 40, h: 10 }],
    };
    return {
      ...defaultGroup(),
      x: 300,
      y: 200,
      w: 400,
      h: 240,
      cw: 200,
      ch: 120,
      children: [tile, dot, title, link, inner],
    };
  }

  it("a group round-trips through a saved recipe, nested groups and lines included", () => {
    const group = card();
    const saved = recipeFromElement("Tarjeta", group);
    const back = resolved(saved) as GroupEl;
    expect(withoutId(back)).toEqual(withoutId({ ...group, name: "Tarjeta" }));
  });

  it("stores children compactly under local ids, with no canvas ids", () => {
    const group = card();
    const saved = recipeFromElement("Tarjeta", group);
    const json = JSON.stringify(saved);
    for (const child of group.children) expect(json).not.toContain(child.id);
    const children = (saved.set as { children: Record<string, unknown>[] })
      .children;
    expect(children[0]).toEqual({ id: "c1", kind: "rect", w: 200, h: 120 });
    expect(children[3]).toMatchObject({
      kind: "line",
      a: { attach: "c2" },
      b: { attach: "c3" },
    });
  });

  it("each drop gets fresh ids for the whole tree, attachments following", () => {
    const recipe = recipeFromElement("Tarjeta", card());
    const one = cloneElement(resolved(recipe)) as GroupEl;
    const two = cloneElement(resolved(recipe)) as GroupEl;
    const ids = (g: GroupEl) => g.children.map((c) => c.id);
    expect(ids(one)).not.toEqual(ids(two));
    const line = one.children[3];
    if (line?.kind !== "line") throw new Error("expected a line");
    expect(line.a.attach).toBe(one.children[1]?.id);
    expect(line.b.attach).toBe(one.children[2]?.id);
  });

  it("a child of an unknown kind is reported, not dropped", () => {
    const r = resolveElement({
      name: "Roto",
      kind: "group",
      traits: [],
      set: { children: [{ kind: "nope" }] } as never,
    });
    expect(r).toEqual({ error: "Tipo de elemento desconocido «nope»" });
  });
});

describe("dropped elements", () => {
  it("are not affected by later changes to the recipe or its traits", () => {
    const recipe = structuredClone(
      BUILT_IN_RECIPES.find((r) => r.name === "Tarjeta neón") as PresetRecipe,
    );
    const dropped = cloneElement(resolved(recipe));
    const before = structuredClone(dropped);

    (recipe.set as { label: { text: string } }).label.text = "Cambiado";
    recipe.traits.push("no-glow");
    const glow = TRAITS.get("glow");
    const saved = glow?.params.color;
    if (glow) glow.params.color = "#ff0000";
    try {
      expect(resolved(recipe)).not.toEqual(dropped);
      expect(dropped).toEqual(before);
    } finally {
      if (glow && saved !== undefined) glow.params.color = saved;
    }
  });
});

describe("built-in recipe files", () => {
  it("every JSON file in presets/built-in is loaded, with no code listing them", () => {
    const dir = join(import.meta.dirname, "../../presets/built-in");
    const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    const names = files
      .sort()
      .map(
        (f) =>
          (JSON.parse(readFileSync(join(dir, f), "utf8")) as PresetRecipe).name,
      );
    const loaded = [...BUILT_IN_RECIPES, ...BUILT_IN_BACKGROUNDS];
    expect(loaded.map((r) => r.name).sort()).toEqual(names.sort());
  });
});
