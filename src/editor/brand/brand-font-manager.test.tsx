// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResolvedFont } from "../../model/font-files.ts";
import { BrandFontManager } from "./brand-font-manager.tsx";

const uploadFont = vi.fn();
const installFromGoogle = vi.fn();
vi.mock("./font-api.ts", () => ({
  uploadFont: (...a: unknown[]) => uploadFont(...a),
  installFromGoogle: (...a: unknown[]) => installFromGoogle(...a),
}));

let listed: ResolvedFont[] = [];
beforeEach(() => {
  uploadFont.mockReset();
  installFromGoogle.mockReset();
  listed = [
    { family: "Inter", weight: 400, origin: "bundled" },
    { family: "Lobster", weight: 400, origin: "project" },
    { family: "Oswald", weight: 700, origin: "global" },
  ];
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(listed))),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("BrandFontManager", () => {
  it("lists the project's and global fonts, not the bundled ones", async () => {
    render(<BrandFontManager slug="acme" />);
    await screen.findByText("Lobster 400");
    expect(screen.getByText("Oswald 700")).toBeTruthy();
    expect(screen.queryByText(/Inter/)).toBeNull();
    expect(fetch).toHaveBeenCalledWith("/api/fonts?project=acme");
  });

  it("a chosen file fills family and weight from its name, and uploads to the project", async () => {
    uploadFont.mockResolvedValue({ family: "Lobster", weight: 700 });
    const onFontsChanged = vi.fn();
    render(<BrandFontManager slug="acme" onFontsChanged={onFontsChanged} />);
    const upload = screen.getByText("Subir") as HTMLButtonElement;
    expect(upload.disabled).toBe(true);

    const file = new File(["x"], "Lobster-700.ttf");
    fireEvent.change(
      document.querySelector("input[type=file]") as HTMLInputElement,
      { target: { files: [file] } },
    );
    expect((screen.getByLabelText("Familia") as HTMLInputElement).value).toBe(
      "Lobster",
    );
    expect((screen.getByLabelText("Peso") as HTMLSelectElement).value).toBe(
      "700",
    );
    fireEvent.click(upload);
    await screen.findByText("Fuente «Lobster» 700 añadida");
    expect(uploadFont).toHaveBeenCalledWith(file, {
      family: "Lobster",
      weight: 700,
      project: "acme",
    });
    expect(onFontsChanged).toHaveBeenCalled();
  });

  it("without a project, fonts can only be global", () => {
    render(<BrandFontManager />);
    const [project, global] = screen.getAllByRole(
      "radio",
    ) as HTMLInputElement[];
    expect(project.disabled).toBe(true);
    expect(global.checked).toBe(true);
  });

  it("downloads a Google family with the checked weights", async () => {
    installFromGoogle.mockResolvedValue([
      { family: "Montserrat", weight: 400 },
      { family: "Montserrat", weight: 900 },
    ]);
    render(<BrandFontManager slug="acme" />);
    fireEvent.change(screen.getByLabelText("Familia de Google Fonts"), {
      target: { value: " Montserrat " },
    });
    // 400 and 700 are checked at first: drop 700, add 900
    fireEvent.click(screen.getByLabelText("700"));
    fireEvent.click(screen.getByLabelText("900"));
    fireEvent.click(screen.getByText("Descargar"));
    await screen.findByText("«Montserrat» descargada (400, 900)");
    expect(installFromGoogle).toHaveBeenCalledWith({
      family: "Montserrat",
      weights: [400, 900],
      project: "acme",
    });
  });

  it("shows a failure from the server", async () => {
    installFromGoogle.mockImplementation(async () => {
      throw new Error("Familia no encontrada");
    });
    render(<BrandFontManager />);
    fireEvent.change(screen.getByLabelText("Familia de Google Fonts"), {
      target: { value: "Nope" },
    });
    fireEvent.click(screen.getByText("Descargar"));
    await screen.findByText("Familia no encontrada");
  });
});
