import { describe, expect, it } from "vitest";
import { filterByName, groupByCategory, NO_CATEGORY } from "./categories.ts";
import { BUILT_IN_RECIPES } from "./recipes.ts";

const item = (name: string, category?: string) => ({ name, category });

describe("groupByCategory", () => {
  it("makes one section per category, in first-seen order, loose ones last", () => {
    const items = [
      item("A", "Texto"),
      item("B"),
      item("C", "Tarjetas"),
      item("D", "Texto"),
      item("E", " "),
    ];
    expect(groupByCategory(items)).toEqual([
      { category: "Texto", items: [items[0], items[3]] },
      { category: "Tarjetas", items: [items[2]] },
      { category: NO_CATEGORY, items: [items[1], items[4]] },
    ]);
  });

  it("uses one untitled section when nothing has a category", () => {
    const items = [item("A"), item("B")];
    expect(groupByCategory(items)).toEqual([{ category: "", items }]);
  });

  it("gives nothing for no items", () => {
    expect(groupByCategory([])).toEqual([]);
  });

  it("files every built-in preset under a category", () => {
    const sections = groupByCategory(BUILT_IN_RECIPES);
    expect(sections.map((s) => s.category)).not.toContain(NO_CATEGORY);
    expect(sections.flatMap((s) => s.items)).toHaveLength(
      BUILT_IN_RECIPES.length,
    );
  });
});

describe("filterByName", () => {
  const items = [item("Tarjeta neón"), item("Título"), item("Pill")];

  it("keeps everything for an empty or blank query", () => {
    expect(filterByName(items, "")).toEqual(items);
    expect(filterByName(items, "  ")).toEqual(items);
  });

  it("matches part of the name ignoring case and accents", () => {
    expect(filterByName(items, "NEON")).toEqual([items[0]]);
    expect(filterByName(items, "titu")).toEqual([items[1]]);
    expect(filterByName(items, "t")).toEqual([items[0], items[1]]);
  });

  it("gives nothing when no name matches", () => {
    expect(filterByName(items, "xyz")).toEqual([]);
  });

  it("filters then groups, dropping emptied categories", () => {
    const shown = groupByCategory(filterByName(BUILT_IN_RECIPES, "título"));
    expect(shown.map((s) => s.category)).toEqual(["Texto"]);
  });
});
