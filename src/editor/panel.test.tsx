// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Panel } from "./panel.tsx";

/** A controlled field and a slider inside the panel, like the inspector's. */
function Fields({ checkpoint }: { checkpoint: () => void }) {
  const [name, setName] = useState("Rect");
  const [w, setW] = useState(100);
  return (
    <Panel checkpoint={checkpoint}>
      <input
        aria-label="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input aria-label="other" defaultValue="" />
      <input
        aria-label="w"
        type="range"
        min={0}
        max={500}
        value={w}
        onChange={(e) => setW(Number(e.target.value))}
      />
      <button type="button">Borrar</button>
    </Panel>
  );
}

const setup = () => {
  const checkpoint = vi.fn();
  const view = render(<Fields checkpoint={checkpoint} />);
  const get = (label: string) => view.getByLabelText(label) as HTMLInputElement;
  return { checkpoint, get, view };
};

afterEach(cleanup);

describe("Panel undo steps", () => {
  it("keeps the first typed change and records one step for it", () => {
    const { checkpoint, get } = setup();
    const name = get("name");
    act(() => name.focus());
    fireEvent.change(name, { target: { value: "Rect X" } });
    expect(name.value).toBe("Rect X");
    fireEvent.change(name, { target: { value: "Rect XY" } });
    expect(name.value).toBe("Rect XY");
    expect(checkpoint).toHaveBeenCalledTimes(1);
  });

  it("records nothing for focus or Tab without a change", () => {
    const { checkpoint, get } = setup();
    act(() => get("name").focus());
    act(() => get("other").focus());
    act(() => get("name").focus());
    expect(checkpoint).not.toHaveBeenCalled();
  });

  it("records a new step for the next edit after leaving the field", () => {
    const { checkpoint, get } = setup();
    const name = get("name");
    act(() => name.focus());
    fireEvent.change(name, { target: { value: "A" } });
    act(() => get("other").focus());
    act(() => name.focus());
    fireEvent.change(name, { target: { value: "AB" } });
    expect(checkpoint).toHaveBeenCalledTimes(2);
  });

  it("records one step per slider drag, on pointer down", () => {
    const { checkpoint, get } = setup();
    const w = get("w");
    fireEvent.pointerDown(w);
    fireEvent.change(w, { target: { value: "200" } });
    fireEvent.change(w, { target: { value: "300" } });
    fireEvent.pointerUp(window);
    expect(w.value).toBe("300");
    expect(checkpoint).toHaveBeenCalledTimes(1);
  });

  it("records a step per keyboard change of a slider", () => {
    const { checkpoint, get } = setup();
    const w = get("w");
    act(() => w.focus());
    expect(checkpoint).not.toHaveBeenCalled();
    fireEvent.change(w, { target: { value: "101" } });
    fireEvent.change(w, { target: { value: "102" } });
    expect(checkpoint).toHaveBeenCalledTimes(2);
  });

  it("records a step when a button is pressed", () => {
    const { checkpoint, view } = setup();
    fireEvent.pointerDown(view.getByText("Borrar"));
    expect(checkpoint).toHaveBeenCalledTimes(1);
  });
});
