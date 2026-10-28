import { afterEach, describe, expect, it, vi } from "vitest";
import { installFromGoogle, uploadFont } from "./font-api.ts";

/** A fake font API that answers `status` with `body` and records each call. */
function api(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status });
  });
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe("uploadFont", () => {
  it("posts the file's bytes with family, weight, extension and project", async () => {
    const calls = api(200, { family: "Lobster", weight: 700 });
    const file = new File(["abc"], "Lobster-Bold.TTF");
    const saved = await uploadFont(file, {
      family: "Lobster",
      weight: 700,
      project: "acme",
    });
    expect(saved).toEqual({ family: "Lobster", weight: 700 });
    const url = new URL(calls[0].url, "http://x");
    expect(url.pathname).toBe("/api/fonts/upload");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      family: "Lobster",
      weight: "700",
      ext: "ttf",
      project: "acme",
    });
    expect(calls[0].init.method).toBe("POST");
    expect(new TextDecoder().decode(calls[0].init.body as ArrayBuffer)).toBe(
      "abc",
    );
  });

  it("without a project the font is global", async () => {
    const calls = api(200, {});
    await uploadFont(new File([""], "a.woff2"), { family: "A", weight: 400 });
    expect(calls[0].url).not.toContain("project");
  });

  it("fails with the server's message, or the status without one", async () => {
    api(400, { error: "Extensión no admitida" });
    await expect(
      uploadFont(new File([""], "a.txt"), { family: "A", weight: 400 }),
    ).rejects.toThrow("Extensión no admitida");
    vi.stubGlobal(
      "fetch",
      async () => new Response("not json", { status: 502 }),
    );
    await expect(
      uploadFont(new File([""], "a.ttf"), { family: "A", weight: 400 }),
    ).rejects.toThrow("Error 502");
  });
});

describe("installFromGoogle", () => {
  it("posts the family and weights as JSON and returns the saved files", async () => {
    const files = [
      { family: "Montserrat", weight: 400 },
      { family: "Montserrat", weight: 700 },
    ];
    const calls = api(200, files);
    const request = { family: "Montserrat", weights: [400, 700] };
    expect(await installFromGoogle(request)).toEqual(files);
    expect(calls[0].url).toBe("/api/fonts/google");
    expect(JSON.parse(calls[0].init.body as string)).toEqual(request);
  });
});
