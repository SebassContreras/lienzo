import { describe, expect, it } from "vitest";
import { createElement } from "../../components/index.ts";
import { defaultScene, type Scene } from "../../model/model.ts";
import { brandFontNotices, fontNotices, missingFonts } from "./font-check.ts";

function text(font: string) {
  return { ...createElement("text"), font };
}

function subtitles(font: string) {
  return { ...createElement("subtitles"), font };
}

function sceneWith(elements: Scene["elements"]): Scene {
  return { ...defaultScene(), elements };
}

describe("missingFonts", () => {
  it("names a text font that is not installed", () => {
    const scene = sceneWith([text("Montserrat")]);

    expect(missingFonts(scene, ["Inter"])).toEqual(["Montserrat"]);
  });

  it("finds a subtitles font inside a group", () => {
    const group = { ...createElement("group"), children: [subtitles("Lato")] };

    expect(missingFonts(sceneWith([group]), ["Inter"])).toEqual(["Lato"]);
  });

  it("finds a font inside a symbol", () => {
    const scene = {
      ...defaultScene(),
      symbols: { card: { w: 100, h: 100, children: [text("Lato")] } },
    };

    expect(missingFonts(scene, ["Inter"])).toEqual(["Lato"]);
  });

  it("matches family names ignoring case", () => {
    expect(missingFonts(sceneWith([text("inter")]), ["Inter"])).toEqual([]);
  });

  it("never reports a CSS generic family", () => {
    expect(missingFonts(sceneWith([text("serif")]), [])).toEqual([]);
  });

  it("names each missing family once", () => {
    const scene = sceneWith([text("Lato"), subtitles("Lato")]);

    expect(missingFonts(scene, [])).toEqual(["Lato"]);
  });
});

describe("fontNotices weights", () => {
  const poppins = [400, 600, 800].map((weight) => ({
    family: "Poppins",
    weight,
  }));

  it("names the weight drawn instead of one the family lacks", () => {
    const heavy = { ...createElement("text"), font: "Poppins", weight: 900 };

    expect(fontNotices(sceneWith([heavy]), poppins)).toEqual([
      "Poppins no tiene peso 900; se dibuja 800",
    ]);
  });

  it("is quiet for a weight the family has", () => {
    const semi = {
      ...createElement("subtitles"),
      font: "Poppins",
      weight: 600,
    };

    expect(fontNotices(sceneWith([semi]), poppins)).toEqual([]);
  });
});

describe("brandFontNotices", () => {
  const face = (family: string, weight: number) => ({ family, weight });
  const brand = (family: string, ...weights: number[]) => ({ family, weights });
  const montserrat = [face("Montserrat", 500), face("Montserrat", 800)];

  it.each([
    {
      label: "declared and installed",
      declared: [brand("Montserrat", 500, 800)],
      available: montserrat,
      own: montserrat,
      notices: [],
    },
    {
      label: "declared, not installed",
      declared: [brand("Nope Sans", 400)],
      available: [],
      own: [],
      notices: [/«Nope Sans» no está instalada/],
    },
    {
      label: "installed in the project, not declared",
      declared: [],
      available: montserrat,
      own: montserrat,
      notices: [
        /«Montserrat» está instalada en el proyecto pero no es fuente de marca/,
      ],
    },
    { label: "neither", declared: [], available: [], own: [], notices: [] },
    {
      label: "a declared weight not installed",
      declared: [brand("Montserrat", 500, 800, 900)],
      available: montserrat,
      own: montserrat,
      notices: [/«Montserrat» declara los pesos 900/],
    },
    {
      label: "an installed weight not declared",
      declared: [brand("Montserrat", 500)],
      available: montserrat,
      own: montserrat,
      notices: [],
    },
    {
      label: "a family differing only in letter case",
      declared: [brand("montserrat", 500, 800)],
      available: montserrat,
      own: montserrat,
      notices: [],
    },
    {
      label: "a bundled font not declared",
      declared: [],
      available: [face("Inter", 400)],
      own: [],
      notices: [],
    },
  ])("$label", ({ declared, available, own, notices }) => {
    const result = brandFontNotices(declared, available, own);

    expect(result).toEqual(notices.map((n) => expect.stringMatching(n)));
  });
});
