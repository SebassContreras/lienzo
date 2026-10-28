import { describe, expect, it } from "vitest";
import type { TextEl } from "../components/text/descriptor.ts";
import { defaultElement } from "../model/model.ts";
import { boxOf, textLayout } from "./geometry.ts";

describe("text wrapping and box width", () => {
  it("keeps unwrapped behavior when w is omitted or 0", () => {
    const el = defaultElement("text") as TextEl;
    el.text = "Primer línea\nSegunda línea más larga";
    delete el.w;

    const layout = textLayout(el);
    expect(layout.lines).toEqual(["Primer línea", "Segunda línea más larga"]);
    expect(layout.w).toBe(Math.max(...layout.widths));

    const box = boxOf(el);
    expect(box.w).toBe(layout.w);
    expect(box.h).toBe(layout.h);
  });

  it("wraps words within box width w at word boundaries", () => {
    const el = defaultElement("text") as TextEl;
    el.font = "Inter";
    el.size = 32;
    el.weight = 400;
    el.text = "El cliente pide, el servidor MCP expone herramientas y datos.";

    // When unwrapped, single line width is ~900px
    const unwrapped = textLayout(el);
    expect(unwrapped.lines.length).toBe(1);

    // When box width w is set to 300px
    el.w = 300;
    const wrapped = textLayout(el);

    // Then text wraps into multiple lines
    expect(wrapped.lines.length).toBeGreaterThan(1);
    expect(wrapped.w).toBe(300);

    // Each wrapped line must not exceed w = 300
    for (const lw of wrapped.widths) {
      expect(lw).toBeLessThanOrEqual(300);
    }

    // Box reflects w = 300 and multiplied line height
    const box = boxOf(el);
    expect(box.w).toBe(300);
    expect(box.h).toBe(wrapped.h);
  });

  it("preserves explicit line breaks while wrapping paragraphs", () => {
    const el = defaultElement("text") as TextEl;
    el.font = "Inter";
    el.size = 32;
    el.weight = 400;
    el.text =
      "Párrafo uno muy largo que debe envolverse\n\nPárrafo dos también largo";
    el.w = 250;

    const layout = textLayout(el);
    // Should preserve the empty line between paragraphs
    expect(layout.lines.some((line) => line === "")).toBe(true);
    expect(layout.w).toBe(250);
  });

  it("breaks words longer than box width without hanging or infinite loop", () => {
    const el = defaultElement("text") as TextEl;
    el.font = "Inter";
    el.size = 32;
    el.weight = 400;
    el.text = "Supercalifragilisticoespialidoso";
    el.w = 100;

    const layout = textLayout(el);
    expect(layout.lines.length).toBeGreaterThan(1);
    expect(layout.w).toBe(100);
  });
});
