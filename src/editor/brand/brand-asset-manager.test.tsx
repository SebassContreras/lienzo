// @vitest-environment jsdom
import { File as NodeFile } from "node:buffer";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrandAssetManager } from "./brand-asset-manager.tsx";

/** jsdom's File has no `arrayBuffer`, which the upload reads; Node's has. */
const file = (bits: string[], name: string) =>
  new NodeFile(bits, name) as unknown as File;

/** A fake asset API answering `status` with `body`; returns the calls it got. */
function api(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status });
  });
  return calls;
}

const choose = (chosen: File) =>
  fireEvent.change(
    document.querySelector("input[type=file]") as HTMLInputElement,
    { target: { files: [chosen] } },
  );

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("BrandAssetManager", () => {
  it("uploads a file to the project's assets and reports it", async () => {
    const calls = api(200, { filename: "logo.png", path: "assets/logo.png" });
    const onAssetUploaded = vi.fn();
    render(
      <BrandAssetManager
        slug="acme"
        assets={[]}
        onAssetUploaded={onAssetUploaded}
      />,
    );
    choose(file(["png"], "Logo.PNG"));
    await screen.findByText("Subido con éxito: Logo.PNG");
    expect(calls[0].url).toBe("/api/projects/acme/assets?ext=png");
    expect(onAssetUploaded).toHaveBeenCalledWith("logo.png", "assets/logo.png");
  });

  it("a dropped file is uploaded too", async () => {
    const calls = api(200, { filename: "a.svg", path: "assets/a.svg" });
    render(<BrandAssetManager slug="acme" assets={[]} />);
    fireEvent.drop(screen.getByRole("button"), {
      dataTransfer: { files: [file(["<svg/>"], "a.svg")] },
    });
    await screen.findByText("Subido con éxito: a.svg");
    expect(calls).toHaveLength(1);
  });

  it("shows the server's error, or the status without one", async () => {
    api(413, { error: "Archivo demasiado grande" });
    render(<BrandAssetManager slug="acme" assets={[]} />);
    choose(file(["x"], "big.png"));
    await screen.findByText("Archivo demasiado grande");

    vi.stubGlobal("fetch", async () => new Response("", { status: 500 }));
    choose(file(["x"], "big.png"));
    await screen.findByText("Error al subir el archivo: 500");
  });

  it("without a project nothing is uploaded", async () => {
    const calls = api(200, {});
    render(<BrandAssetManager assets={[]} />);
    choose(file(["x"], "logo.png"));
    await screen.findByText(/Debe seleccionar o guardar un proyecto/);
    expect(calls).toHaveLength(0);
  });

  it("a file without an extension is refused", async () => {
    const calls = api(200, {});
    render(<BrandAssetManager slug="acme" assets={[]} />);
    choose(file(["x"], "logo."));
    await screen.findByText("El archivo no tiene extensión.");
    expect(calls).toHaveLength(0);
  });

  it("disabled, a chosen file is ignored", () => {
    const calls = api(200, {});
    render(<BrandAssetManager slug="acme" assets={[]} disabled />);
    choose(file(["x"], "logo.png"));
    expect(calls).toHaveLength(0);
  });

  it("lists the assets, pictures as thumbnails from the project", () => {
    render(<BrandAssetManager slug="acme" assets={["logo.png", "voz.mp3"]} />);
    expect(
      screen.getByText(/Recursos Gráficos del Proyecto \(2\)/),
    ).toBeTruthy();
    const img = screen.getByAltText("logo.png") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/api/projects/acme/assets/logo.png");
    expect(screen.queryByAltText("voz.mp3")).toBeNull();
    expect(screen.getByTitle("voz.mp3")).toBeTruthy();
  });
});
