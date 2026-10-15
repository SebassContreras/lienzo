import { resolveOpenRouterApiKey, resolveOpenRouterBaseUrl } from "./config.ts";
import {
  POPULAR_TTS_MODELS,
  type SynthesizeSpeechRequest,
  type SynthesizeSpeechResult,
  type TtsModel,
  type TtsService,
} from "./types.ts";

/**
 * OpenRouter implementation of TtsService (D2, R2, R3).
 * Follows Principle 3 (Service Layer + Anti-Corruption / Dependency Inversion).
 */
export class OpenRouterTtsAdapter implements TtsService {
  constructor(
    private readonly defaultApiKey?: string,
    private readonly baseUrl?: string,
    private readonly fetchFn: typeof fetch = globalThis.fetch.bind(globalThis),
  ) {}

  async listModels(): Promise<TtsModel[]> {
    return POPULAR_TTS_MODELS;
  }

  async synthesizeSpeech(
    request: SynthesizeSpeechRequest,
  ): Promise<SynthesizeSpeechResult> {
    const apiKey = resolveOpenRouterApiKey(
      request.apiKey || this.defaultApiKey,
    );
    if (!apiKey) {
      throw new Error(
        "Clave de API de OpenRouter no configurada. Configura OPENROUTER_API_KEY o proporciónala en la petición.",
      );
    }

    if (!request.text || request.text.trim().length === 0) {
      throw new Error("El texto a sintetizar no puede estar vacío.");
    }

    const endpoint = resolveOpenRouterBaseUrl(request.baseUrl || this.baseUrl);

    const model = request.model || "openai/tts-1";
    const voice = request.voice || "alloy";
    const responseFormat = request.format || "mp3";
    const speed = request.speed ?? 1.0;

    const payload = {
      model,
      input: request.text,
      voice,
      response_format: responseFormat,
      speed,
    };

    const response = await this.fetchFn(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lienzo.editor",
        "X-Title": "Lienzo Video Editor",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMsg = `Error de OpenRouter TTS (${response.status} ${response.statusText})`;
      try {
        const errorJson = (await response.json()) as {
          error?: { message?: string };
        };
        if (errorJson?.error?.message) {
          errorMsg = `${errorMsg}: ${errorJson.error.message}`;
        }
      } catch {
        // Fallback to text status
      }
      throw new Error(errorMsg);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = new Uint8Array(arrayBuffer);

    const mimeMap: Record<string, string> = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      aac: "audio/aac",
      opus: "audio/opus",
    };

    return {
      audioBuffer,
      mimeType: mimeMap[responseFormat] || "audio/mpeg",
      format: responseFormat,
    };
  }
}
