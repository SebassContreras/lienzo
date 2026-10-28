// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ColorPalette } from "../../model/project.ts";
import { BrandPaletteEditor } from "./brand-palette-editor.tsx";

afterEach(cleanup);

function editor(value: ColorPalette, disabled = false) {
  const onChange = vi.fn();
  render(
    <BrandPaletteEditor
      value={value}
      onChange={onChange}
      disabled={disabled}
    />,
  );
  return onChange;
}

describe("BrandPaletteEditor", () => {
  it("sets a named color, and clearing an optional one removes it", () => {
    const onChange = editor({
      primary: "#111111",
      accent: "#ff0000",
      custom: [],
    });
    fireEvent.change(screen.getByLabelText(/Secundario/), {
      target: { value: "#00ff00" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      primary: "#111111",
      accent: "#ff0000",
      secondary: "#00ff00",
      custom: [],
    });
    fireEvent.change(screen.getByLabelText(/Acento/), {
      target: { value: "" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      primary: "#111111",
      accent: undefined,
      custom: [],
    });
  });

  it("adds, edits and removes custom colors by position", () => {
    const onChange = editor({
      primary: "#111111",
      custom: ["#aaaaaa", "#bbbbbb"],
    });
    fireEvent.click(screen.getByText("Agregar color"));
    expect(onChange.mock.lastCall?.[0].custom).toEqual([
      "#aaaaaa",
      "#bbbbbb",
      "#6366f1",
    ]);
    // each custom color has a picker and a text field with the same value
    const [, text] = screen.getAllByDisplayValue("#bbbbbb");
    fireEvent.change(text, { target: { value: "#cccccc" } });
    expect(onChange.mock.lastCall?.[0].custom).toEqual(["#aaaaaa", "#cccccc"]);
    fireEvent.click(screen.getAllByTitle("Eliminar color")[0]);
    expect(onChange.mock.lastCall?.[0].custom).toEqual(["#bbbbbb"]);
  });

  it("says when there are no custom colors", () => {
    editor({ primary: "#111111", custom: [] });
    expect(screen.getByText(/Sin colores secundarios/)).toBeTruthy();
  });

  it("disabled, nothing can be edited", () => {
    editor({ primary: "#111111", custom: ["#aaaaaa"] }, true);
    const controls = [
      ...document.querySelectorAll("input, button"),
    ] as HTMLInputElement[];
    expect(controls.every((c) => c.disabled)).toBe(true);
  });
});
