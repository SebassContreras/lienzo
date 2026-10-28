import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { downloadGoogleFont, parseGoogleCss } from "./google-fonts.ts";

/** A css2 answer for Roboto 400 and 700, as served to a non-browser client, recorded 2026-10-27: one ttf per weight. */
const CSS = readFileSync(
  new URL("../../test/fixtures/google-css2-roboto-ttf.css", import.meta.url),
  "utf8",
);
const TTF_400 =
  "https://fonts.gstatic.com/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbWmT.ttf";

describe("parseGoogleCss", () => {
  it("takes the ttf file of each weight", () => {
    const faces = parseGoogleCss(CSS);

    expect(faces.map((f) => f.weight)).toEqual([400, 700]);
    expect(faces[0]?.url).toBe(TTF_400);
  });

  it("finds nothing in an answer without font faces", () => {
    expect(parseGoogleCss("/* nothing */")).toEqual([]);
  });
});

describe("downloadGoogleFont", () => {
  it("downloads one ttf file per weight, which Node can measure", async () => {
    const fakeFetch = (async (url: string) =>
      url.startsWith("https://fonts.googleapis.com/")
        ? new Response(CSS)
        : new Response(`bytes of ${url}`)) as typeof fetch;

    const files = await downloadGoogleFont("Roboto", [400, 700], fakeFetch);

    expect(files.map((f) => f.weight)).toEqual([400, 700]);
    expect(files[0]?.data.toString()).toBe(`bytes of ${TTF_400}`);
  });

  it("fails with the family's name when Google does not know it", async () => {
    const fakeFetch = (async () =>
      new Response("", { status: 400 })) as typeof fetch;

    await expect(
      downloadGoogleFont("No Existe", [400], fakeFetch),
    ).rejects.toThrow("No Existe");
  });

  it("names the HTTP status as such", async () => {
    const fakeFetch = (async () =>
      new Response("", { status: 400 })) as typeof fetch;

    await expect(
      downloadGoogleFont("No Existe", [400], fakeFetch),
    ).rejects.toThrow("(HTTP 400)");
  });
});

describe("downloadGoogleFont format", () => {
  it("asks Google for ttf, not the woff2 a browser gets", async () => {
    // Arrange
    const asked: (string | null)[] = [];
    const fakeFetch = (async (url: string, init?: RequestInit) => {
      if (url.startsWith("https://fonts.googleapis.com/")) {
        asked.push(new Headers(init?.headers).get("user-agent"));
        return new Response(CSS);
      }
      return new Response("bytes");
    }) as typeof fetch;

    // Act
    await downloadGoogleFont("Roboto", [400], fakeFetch);

    // Assert
    expect(asked).toEqual([null]);
  });
});
