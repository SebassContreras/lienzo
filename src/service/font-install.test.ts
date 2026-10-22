import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { availableFonts, saveFont } from "./font-install.ts";
import { createFontStore, type FontStore } from "./font-store.ts";

const BYTES = Buffer.from("font-bytes");

describe("saveFont", () => {
  let root: string;
  let store: FontStore;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "lienzo-fonts-"));
    store = createFontStore(root);
  });

  afterEach(() => rm(root, { recursive: true, force: true }));

  it("stores a project font as Family-Weight.ext in that project's fonts/", async () => {
    await saveFont(
      store,
      { family: "Brand", weight: 700, ext: "woff2", project: "acme" },
      BYTES,
    );

    expect(await readdir(join(root, "projects", "acme", "fonts"))).toEqual([
      "Brand-700.woff2",
    ]);
  });

  it("stores a font without project in the global fonts/", async () => {
    await saveFont(store, { family: "Brand", weight: 400, ext: "ttf" }, BYTES);

    expect(await readdir(join(root, "fonts"))).toEqual(["Brand-400.ttf"]);
  });

  it("refuses a file that is not a font", async () => {
    await expect(
      saveFont(store, { family: "Brand", weight: 400, ext: "exe" }, BYTES),
    ).rejects.toThrow("Formato no soportado");
  });

  it("refuses a family name that could escape the folder", async () => {
    await expect(
      saveFont(store, { family: "../x", weight: 400, ext: "ttf" }, BYTES),
    ).rejects.toThrow("Nombre de familia no válido");
  });

  it("refuses a weight outside 100-900", async () => {
    await expect(
      saveFont(store, { family: "Brand", weight: 1000, ext: "ttf" }, BYTES),
    ).rejects.toThrow("peso");
  });

  it("makes a saved project font available to that project only", async () => {
    await saveFont(
      store,
      { family: "Brand", weight: 400, ext: "woff2", project: "acme" },
      BYTES,
    );

    const inAcme = await availableFonts(store, "acme");
    const elsewhere = await availableFonts(store, "otro");

    expect(inAcme.some((f) => f.family === "Brand")).toBe(true);
    expect(elsewhere.some((f) => f.family === "Brand")).toBe(false);
  });
});
