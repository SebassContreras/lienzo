import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleTtsProxy } from "./tts-proxy.ts";

/** A request with `body`, and a response that records what the handler wrote. */
function exchange(body: string, method = "POST") {
  const req = Object.assign(Readable.from([Buffer.from(body)]), {
    method,
  }) as unknown as IncomingMessage;
  const out = { status: 0, headers: {} as Record<string, string>, body: "" };
  const res = {
    set statusCode(v: number) {
      out.status = v;
    },
    setHeader: (k: string, v: string) => {
      out.headers[k] = v;
    },
    end: (chunk?: Uint8Array | string) => {
      out.body = chunk ? Buffer.from(chunk).toString("utf8") : "";
    },
  } as unknown as ServerResponse;
  return { req, res, out };
}

describe("TTS proxy", () => {
  let original: string | undefined;
  beforeEach(() => {
    original = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "sk-server";
  });
  afterEach(() => {
    if (original === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = original;
  });

  it("forwards the speech request with the server key", async () => {
    let auth = "";
    let sent: Record<string, unknown> = {};
    const fakeFetch = (async (_: string, init: RequestInit) => {
      auth = (init.headers as Record<string, string>).Authorization ?? "";
      sent = JSON.parse(String(init.body));
      return new Response("audio", { status: 200 });
    }) as unknown as typeof fetch;
    const { req, res, out } = exchange(
      JSON.stringify({ model: "openai/tts-1", input: "Hola", voice: "nova" }),
    );
    await handleTtsProxy(req, res, fakeFetch);
    expect(auth).toBe("Bearer sk-server");
    expect(sent).toMatchObject({ input: "Hola", voice: "nova" });
    expect(out.status).toBe(200);
    expect(out.headers["content-type"]).toBe("audio/mpeg");
    expect(out.body).toBe("audio");
  });

  it("answers in the OpenRouter error shape without a server key", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const { req, res, out } = exchange("{}");
    await handleTtsProxy(req, res, fetch);
    expect(out.status).toBe(500);
    expect(JSON.parse(out.body).error.message).toContain("OPENROUTER_API_KEY");
  });
});
