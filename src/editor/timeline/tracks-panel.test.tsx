// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "../../components/index.ts";
import type { Element } from "../../model/model.ts";
import type { Clock } from "../stage.tsx";
import { TracksPanel } from "./tracks-panel.tsx";

afterEach(cleanup);
// jsdom has no pointer capture
HTMLElement.prototype.setPointerCapture = () => {};

const keys = [
  { t: 0, value: 0, easing: "auto" as const },
  { t: 1, value: 100, easing: "auto" as const },
];

/** The panel over an element it really edits; `latest` is the element after each change. */
function panel(tracks: Element["tracks"]) {
  const seek = vi.fn();
  const checkpoint = vi.fn();
  const latest: { el?: Element } = {};
  function Host() {
    const [el, setEl] = useState<Element>({
      ...createElement("rect"),
      tracks,
    });
    latest.el = el;
    return (
      <TracksPanel
        el={el}
        duration={2}
        clock={{ current: { t: 0, playing: false } as Clock }}
        seek={seek}
        checkpoint={checkpoint}
        change={(fn) =>
          setEl((prev) => {
            const draft = structuredClone(prev);
            fn(draft);
            return draft;
          })
        }
      />
    );
  }
  render(<Host />);
  return { seek, checkpoint, latest };
}

const panelNode = () => document.querySelector(".tracks-panel") as HTMLElement;
const marks = () =>
  [...document.querySelectorAll(".keyframe")] as HTMLButtonElement[];

describe("TracksPanel", () => {
  it("shows nothing for an element without tracks", () => {
    panel(undefined);
    expect(document.querySelector(".tracks-panel")).toBeNull();
  });

  it("one row per track, named by its field or channel", () => {
    panel({ x: keys, "@rotate": keys });
    const labels = [...document.querySelectorAll(".track-label")].map(
      (l) => l.textContent,
    );
    expect(labels).toEqual(["X", "Rotación"]);
    expect(marks()).toHaveLength(4);
    expect(marks()[1].style.left).toBe("50%");
  });

  it("picking a mark seeks to it, and Delete removes it", () => {
    const { seek, checkpoint, latest } = panel({ x: keys });
    fireEvent.pointerDown(marks()[1]);
    expect(seek).toHaveBeenCalledWith(1);
    fireEvent.pointerUp(panelNode());
    fireEvent.keyDown(panelNode(), {
      key: "Delete",
    });
    expect(checkpoint).toHaveBeenCalled();
    expect(latest.el?.tracks?.x).toEqual([keys[0]]);
  });

  it("the easing of the picked mark is set below", () => {
    const { latest } = panel({ x: keys });
    fireEvent.pointerDown(marks()[0]);
    const easing = screen.getByText(/Curva desde 0.00 s \(X\)/)
      .nextElementSibling as HTMLSelectElement;
    fireEvent.change(easing, { target: { value: "ease-out" } });
    expect(latest.el?.tracks?.x).toEqual([
      { ...keys[0], easing: "ease-out" },
      keys[1],
    ]);
  });

  it("repeat and until are kept on the track", () => {
    const { latest } = panel({ x: keys });
    fireEvent.change(screen.getByLabelText("Repetición"), {
      target: { value: "loop" },
    });
    fireEvent.change(screen.getByLabelText("Hasta (s)"), {
      target: { value: "1.5" },
    });
    expect(latest.el?.tracks?.x).toEqual({ keys, repeat: "loop", until: 1.5 });
    fireEvent.change(screen.getByLabelText("Repetición"), {
      target: { value: "none" },
    });
    fireEvent.change(screen.getByLabelText("Hasta (s)"), {
      target: { value: "" },
    });
    expect(latest.el?.tracks?.x).toEqual(keys);
  });
});
