import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { downloadGoogleFont, parseGoogleCss } from "./google-fonts.ts";

/** A css2 answer for Roboto 400 and 700, recorded 2026-10-22 (cyrillic and latin only). */
const CSS = readFileSync(
  new URL("../test/fixtures/google-css2-roboto.css", import.meta.url),
  "utf8",
);
const LATIN_400 =
  "https://fonts.gstatic.com/s/roboto/v51/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBA.woff2";

describe("parseGoogleCss", () => {
  it("takes the latin file of each weight", () => {
    const faces = parseGoogleCss(CSS);

    expect(faces.map((f) => f.weight)).toEqual([400, 700]);
    expect(faces[0]?.url).toBe(LATIN_400);
  });

  it("finds nothing in an answer without font faces", () => {
    expect(parseGoogleCss("/* nothing */")).toEqual([]);
  });
});

describe("downloadGoogleFont", () => {
  it("downloads one woff2 file per weight", async () => {
    const fakeFetch = (async (url: string) =>
      url.startsWith("https://fonts.googleapis.com/")
        ? new Response(CSS)
        : new Response(`bytes of ${url}`)) as typeof fetch;

    const files = await downloadGoogleFont("Roboto", [400, 700], fakeFetch);

    expect(files.map((f) => f.weight)).toEqual([400, 700]);
    expect(files[0]?.data.toString()).toBe(`bytes of ${LATIN_400}`);
  });

  it("fails with the family's name when Google does not know it", async () => {
    const fakeFetch = (async () =>
      new Response("", { status: 400 })) as typeof fetch;

    await expect(
      downloadGoogleFont("No Existe", [400], fakeFetch),
    ).rejects.toThrow("No Existe");
  });
});
