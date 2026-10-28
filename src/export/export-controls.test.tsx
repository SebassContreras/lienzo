// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultScene, type Scene } from "../model/model.ts";
import type { ExportOptions } from "./export.ts";
import { ExportControls } from "./export-controls.tsx";

const exportScene = vi.fn();
const download = vi.fn();
vi.mock("./export.ts", () => ({
  exportScene: (...a: unknown[]) => exportScene(...a),
}));
vi.mock("./download.ts", () => ({
  download: (...a: unknown[]) => download(...a),
}));

function controls(scene: Scene, setStatus = vi.fn()) {
  render(
    <ExportControls
      scene={scene}
      time={() => 2}
      fileName="promo"
      setStatus={setStatus}
    />,
  );
  return setStatus;
}

const pick = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const exportButton = () => screen.getByRole("button", { name: /Exportar/ });

beforeEach(() => {
  exportScene.mockReset();
  download.mockReset();
});
afterEach(cleanup);

describe("ExportControls", () => {
  it("exports a PNG at the playhead and downloads it under the scene name", async () => {
    exportScene.mockResolvedValue(new Blob(["x"], { type: "image/png" }));
    const setStatus = controls(defaultScene());
    pick("Tamaño", "0.5");
    fireEvent.click(exportButton());
    await vi.waitFor(() => expect(download).toHaveBeenCalled());
    const options = exportScene.mock.calls[0][1] as ExportOptions;
    expect(options).toMatchObject({ format: "png", scale: 0.5, time: 2 });
    expect(download.mock.calls[0][1]).toBe("promo.png");
    expect(setStatus).toHaveBeenLastCalledWith(
      expect.stringMatching(/^Exportado promo\.png/),
    );
  });

  it("a GIF is exported at 25 fps at most", async () => {
    exportScene.mockResolvedValue(new Blob([], { type: "image/gif" }));
    controls({ ...defaultScene(), fps: 60 });
    pick("Formato", "gif");
    fireEvent.click(exportButton());
    await vi.waitFor(() => expect(download).toHaveBeenCalled());
    expect((exportScene.mock.calls[0][1] as ExportOptions).fps).toBe(25);
  });

  it("an MP4 the browser wrote as WebM is saved as .webm", async () => {
    exportScene.mockResolvedValue(new Blob([], { type: "video/webm" }));
    controls(defaultScene());
    pick("Formato", "mp4");
    fireEvent.click(exportButton());
    await vi.waitFor(() => expect(download).toHaveBeenCalled());
    expect(download.mock.calls[0][1]).toBe("promo.webm");
  });

  it("reports progress, and a failure in the status without downloading", async () => {
    exportScene.mockImplementation(async (_s, _o, progress) => {
      progress(1, 3);
      throw new Error("sin memoria");
    });
    const setStatus = controls(defaultScene());
    fireEvent.click(exportButton());
    await vi.waitFor(() =>
      expect(setStatus).toHaveBeenLastCalledWith(
        "Error al exportar: Error: sin memoria",
      ),
    );
    expect(setStatus).toHaveBeenCalledWith("Exportando 1/3…");
    expect(download).not.toHaveBeenCalled();
    expect((exportButton() as HTMLButtonElement).disabled).toBe(false);
  });

  it("a static scene exports only PNG", () => {
    controls({ ...defaultScene(), mode: "static" } as Scene);
    const options = screen.getAllByRole("option") as HTMLOptionElement[];
    const disabled = options.filter((o) => o.disabled).map((o) => o.value);
    expect(disabled).toEqual(["gif", "mp4"]);
  });
});
