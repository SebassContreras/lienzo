// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OriginPicker } from "./origin-picker.tsx";

afterEach(cleanup);

describe("OriginPicker", () => {
  it("marks the anchor of the current pivot, centre by default", () => {
    render(<OriginPicker value={undefined} onChange={() => {}} />);
    const pressed = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-pressed") === "true");
    expect(pressed.map((b) => b.title)).toEqual(["center"]);
  });

  it("an anchor sets the pivot to its fractions", () => {
    const onChange = vi.fn();
    render(<OriginPicker value={{ x: 0.5, y: 0.5 }} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Pivote bottom-right"));
    expect(onChange).toHaveBeenCalledWith({ x: 1, y: 1 });
  });

  it("a number changes one axis and keeps the other", () => {
    const onChange = vi.fn();
    render(<OriginPicker value={{ x: 0.2, y: 0.7 }} onChange={onChange} />);
    const [x] = screen.getAllByRole("spinbutton");
    fireEvent.change(x, { target: { value: "0.4" } });
    expect(onChange).toHaveBeenCalledWith({ x: 0.4, y: 0.7 });
  });
});
