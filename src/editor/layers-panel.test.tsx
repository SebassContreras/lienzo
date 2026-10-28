// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultElement, defaultScene, type Scene } from "../model/model.ts";
import { LayersPanel } from "./layers-panel.tsx";

afterEach(cleanup);

describe("LayersPanel search, shot grouping, and auto-reveal", () => {
  it("filters elements by text search on name or id", () => {
    const scene: Scene = {
      ...defaultScene(),
      elements: [
        { ...defaultElement("rect"), id: "hero-card", name: "Tarjeta Hero" },
        {
          ...defaultElement("text"),
          id: "subtitle",
          name: "Subtítulo Principal",
        },
        { ...defaultElement("rect"), id: "footer-bg", name: "Fondo Pie" },
      ],
    };

    const onSelect = vi.fn();
    const onChangeScene = vi.fn();

    const view = render(
      <LayersPanel
        scene={scene}
        selection={[]}
        onSelect={onSelect}
        onChangeScene={onChangeScene}
      />,
    );

    expect(view.getByText("Tarjeta Hero")).toBeDefined();
    expect(view.getByText("Subtítulo Principal")).toBeDefined();
    expect(view.getByText("Fondo Pie")).toBeDefined();

    // Type in search box
    const searchInput = view.getByPlaceholderText("Buscar capas...");
    fireEvent.change(searchInput, { target: { value: "hero" } });

    expect(view.getByText("Tarjeta Hero")).toBeDefined();
    expect(view.queryByText("Subtítulo Principal")).toBeNull();
    expect(view.queryByText("Fondo Pie")).toBeNull();
  });

  it("groups elements by shot and toggles shot collapse", () => {
    const scene: Scene = {
      ...defaultScene(),
      shots: [
        { id: "intro", name: "Intro", start: 0, end: 2 },
        { id: "outro", name: "Outro", start: 2, end: 5 },
      ],
      elements: [
        {
          ...defaultElement("rect"),
          id: "card-intro",
          name: "Caja Intro",
          shot: "intro",
        },
        {
          ...defaultElement("text"),
          id: "text-outro",
          name: "Texto Outro",
          shot: "outro",
        },
        { ...defaultElement("rect"), id: "logo", name: "Logo Global" }, // no shot
      ],
    };

    const view = render(
      <LayersPanel
        scene={scene}
        selection={[]}
        onSelect={vi.fn()}
        onChangeScene={vi.fn()}
      />,
    );

    // Section headers should be visible
    expect(view.getByText("Toma: Intro (0s - 2s)")).toBeDefined();
    expect(view.getByText("Toma: Outro (2s - 5s)")).toBeDefined();
    expect(view.getByText("Global / Sin toma")).toBeDefined();

    // Elements should be rendered inside their sections
    expect(view.getByText("Caja Intro")).toBeDefined();
    expect(view.getByText("Texto Outro")).toBeDefined();
    expect(view.getByText("Logo Global")).toBeDefined();

    // Click on Intro shot header to collapse it
    const introHeader = view.getByText("Toma: Intro (0s - 2s)");
    fireEvent.click(introHeader);

    // Intro element should now be collapsed
    expect(view.queryByText("Caja Intro")).toBeNull();
    // Outro should still be open
    expect(view.getByText("Texto Outro")).toBeDefined();
  });

  it("auto-expands shot group and scrolls into view when element is selected", () => {
    // Mock scrollIntoView
    const scrollMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollMock;

    const scene: Scene = {
      ...defaultScene(),
      shots: [{ id: "shot-1", name: "Toma 1", start: 0, end: 3 }],
      elements: [
        {
          ...defaultElement("rect"),
          id: "target-el",
          name: "Objetivo",
          shot: "shot-1",
        },
      ],
    };

    const { rerender, queryByText } = render(
      <LayersPanel
        scene={scene}
        selection={[]}
        onSelect={vi.fn()}
        onChangeScene={vi.fn()}
      />,
    );

    // Collapse the shot
    const header = queryByText("Toma: Toma 1 (0s - 3s)");
    expect(header).toBeDefined();
    if (header) fireEvent.click(header);
    expect(queryByText("Objetivo")).toBeNull();

    // Rerender with selection containing target-el
    rerender(
      <LayersPanel
        scene={scene}
        selection={["target-el"]}
        onSelect={vi.fn()}
        onChangeScene={vi.fn()}
      />,
    );

    // Auto-expanded: element is now visible
    expect(queryByText("Objetivo")).toBeDefined();
  });
});
