/**
 * The editor's OpenRouter speech endpoint (046/D4): POST /api/tts/speech takes the body the
 * OpenRouter adapter sends ({ model, input, voice, response_format, speed }) and synthesizes
 * it with the server's `OPENROUTER_API_KEY`, so the key never reaches the browser. Errors
 * come back in OpenRouter's shape, `{ error: { message } }`, which the adapter already reads.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolveOpenRouterApiKey } from "./config.ts";
import { OpenRouterTtsAdapter } from "./openrouter-adapter.ts";
import type { SynthesizeSpeechRequest } from "./types.ts";

type SpeechBody = {
  model?: string;
  input?: string;
  voice?: string;
  response_format?: SynthesizeSpeechRequest["format"];
  speed?: number;
};

export async function handleTtsProxy(
  req: IncomingMessage,
  res: ServerResponse,
  get: typeof fetch = fetch,
): Promise<void> {
  const error = (status: number, message: string) => {
    res.setHeader("content-type", "application/json");
    res.statusCode = status;
    res.end(JSON.stringify({ error: { message } }));
  };
  if (req.method !== "POST") return error(405, "Usa POST");
  const apiKey = resolveOpenRouterApiKey();
  if (!apiKey)
    return error(500, "Configura OPENROUTER_API_KEY en el archivo .env");

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  let body: SpeechBody;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as SpeechBody;
  } catch {
    return error(400, "JSON no válido");
  }

  try {
    const result = await new OpenRouterTtsAdapter(
      apiKey,
      undefined,
      get,
    ).synthesizeSpeech({
      text: body.input ?? "",
      model: body.model,
      voice: body.voice ?? "",
      speed: body.speed,
      format: body.response_format,
    });
    res.setHeader("content-type", result.mimeType);
    res.statusCode = 200;
    res.end(result.audioBuffer);
  } catch (e) {
    error(502, (e as Error).message);
  }
}
