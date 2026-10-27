import { describe, expect, it } from "vitest";
import { parseFontFile, resolveFonts } from "./font-files.ts";

describe("parseFontFile", () => {
  it("reads family and weight from Family-Weight.ext", () => {
    expect(parseFontFile("Open Sans-700.woff2")).toEqual({
      family: "Open Sans",
      weight: 700,
      file: "Open Sans-700.woff2",
    });
  });

  it("keeps a hyphenated family whole by splitting on the last dash", () => {
    expect(parseFontFile("Noto-Sans-300.ttf")?.family).toBe("Noto-Sans");
  });

  it("takes weight 400 when the name has no weight", () => {
    expect(parseFontFile("Lobster.otf")?.weight).toBe(400);
  });

  it("ignores files that are not fonts", () => {
    expect(parseFontFile("notes.txt")).toBeUndefined();
  });
});

describe("resolveFonts", () => {
  const global = [{ family: "Brand", weight: 400, file: "Brand-400.woff2" }];
  const project = [{ family: "Brand", weight: 700, file: "Brand-700.woff2" }];

  it("lets a project font hide the global font of the same family", () => {
    const fonts = resolveFonts([], global, project, "acme");

    expect(fonts.filter((f) => f.family === "Brand")).toEqual([
      {
        family: "Brand",
        weight: 700,
        origin: "project",
        url: "/api/fonts/project/acme/Brand-700.woff2",
      },
    ]);
  });

  it("offers global fonts in every project", () => {
    const fonts = resolveFonts([], global, [], "acme");

    expect(fonts.map((f) => f.origin)).toEqual(["global"]);
  });

  it("lets a user font replace a bundled font of the same name", () => {
    const fonts = resolveFonts(["Brand", "Inter"], global);

    expect(fonts.map((f) => `${f.family}:${f.origin}`)).toEqual([
      ...Array(4).fill("Inter:bundled"),
      "Brand:global",
    ]);
  });

  it("lists every bundled weight (069/D10)", () => {
    expect(resolveFonts(["Inter"], []).map((f) => f.weight)).toEqual([
      400, 600, 700, 800,
    ]);
  });
});
