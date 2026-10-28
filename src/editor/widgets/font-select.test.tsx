// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FontSelect } from "./font-select.tsx";

afterEach(cleanup);

describe("FontSelect", () => {
  const groups = () =>
    [...document.querySelectorAll("optgroup")].map((g) => [
      g.label,
      [...g.querySelectorAll("option")].map((o) => o.value),
    ]);

  it("groups the families by origin, one entry per family", () => {
    render(
      <FontSelect
        label="Fuente"
        value="Inter"
        fonts={[
          { family: "Inter", weight: 400, origin: "bundled" },
          { family: "Inter", weight: 700, origin: "bundled" },
          { family: "Lobster", weight: 400, origin: "project" },
        ]}
        onChange={() => {}}
      />,
    );
    expect(groups()).toEqual([
      ["Incluidas", ["Inter"]],
      ["Proyecto", ["Lobster"]],
    ]);
  });

  it("keeps a value no font provides, as «No disponible»", () => {
    render(
      <FontSelect
        label="Fuente"
        value="Comic Sans"
        fonts={[{ family: "Inter", weight: 400, origin: "global" }]}
        onChange={() => {}}
      />,
    );
    expect(groups()).toEqual([
      ["Globales", ["Inter"]],
      ["No disponible", ["Comic Sans"]],
    ]);
  });

  it("offers the bundled fonts before the project's load, and reports a pick", () => {
    const onChange = vi.fn();
    render(<FontSelect label="Fuente" value="" onChange={onChange} />);
    const [[label, families]] = groups() as [string, string[]][];
    expect(label).toBe("Incluidas");
    expect(families.length).toBeGreaterThan(1);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: families[1] },
    });
    expect(onChange).toHaveBeenCalledWith(families[1]);
  });
});
