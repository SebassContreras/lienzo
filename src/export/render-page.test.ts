// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultScene } from "../model/model.ts";
import type { ExportOptions } from "./export.ts";

const loadFonts = vi.fn(async () => {});
const exportScene = vi.fn(
  async () => new Blob(["hola"], { type: "image/png" }),
);
vi.mock("../engine/fonts.ts", () => ({ loadFonts }));
vi.mock("./export.ts", () => ({ exportScene }));
vi.mock("../engine/image-pixels.ts", () => ({
  // a 3×3 picture whose only visible pixel is the centre one
  imagePixels: async () => {
    const data = new Uint8ClampedArray(9 * 4);
    data[4 * 4 + 3] = 255;
    return { data, width: 3, height: 3 };
  },
}));

const { mountRenderPage } = await import("./render-page.ts");

afterEach(() => {
  delete window.lienzoExport;
  delete window.lienzoOpaqueBounds;
});

describe("mountRenderPage", () => {
  it("renders the given scene with the project's fonts and hands back base64", async () => {
    mountRenderPage();
    const options: ExportOptions = {
      format: "png",
      scale: 1,
      fps: 30,
      time: 0,
    };
    const scene = defaultScene();
    const file = await window.lienzoExport?.(scene, options, "acme");
    expect(loadFonts).toHaveBeenCalledWith("acme");
    expect(exportScene).toHaveBeenCalledWith(
      scene,
      options,
      expect.any(Function),
    );
    expect(file).toEqual({ base64: btoa("hola"), type: "image/png" });
    expect(document.title).toBe("Lienzo — render");
  });

  it("gives the visible-pixel rectangle of a picture", async () => {
    mountRenderPage();
    const bounds = await window.lienzoOpaqueBounds?.("logo.png");
    expect(bounds).toEqual({ x: 1 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 });
  });
});
