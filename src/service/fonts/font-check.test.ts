import { describe, expect, it } from "vitest";
import { createElement } from "../../components/index.ts";
import { defaultScene, type Scene } from "../../model/model.ts";
import { fontNotices, missingFonts } from "./font-check.ts";

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
