import { resolveLocalTtsBaseUrl } from "./config.ts";
import {
  type SynthesizeSpeechRequest,
  type SynthesizeSpeechResult,
  type TtsModel,
  type TtsService,
} from "./types.ts";

/**
 * Standard models and popular voices available in Kokoro / local TTS servers.
 */
export const POPULAR_LOCAL_TTS_MODELS: TtsModel[] = [
  {
    id: "kokoro",
    name: "Kokoro TTS (Local)",
    provider: "Kokoro",
    voices: [
      { id: "af_heart", name: "Heart (Female / US)", gender: "female" },
      { id: "af_alloy", name: "Alloy (Female / US)", gender: "female" },
      { id: "af_aoede", name: "Aoede (Female / US)", gender: "female" },
      { id: "af_bella", name: "Bella (Female / US)", gender: "female" },
      { id: "af_jessica", name: "Jessica (Female / US)", gender: "female" },
      { id: "af_kore", name: "Kore (Female / US)", gender: "female" },
      { id: "af_nicole", name: "Nicole (Female / US)", gender: "female" },
      { id: "af_nova", name: "Nova (Female / US)", gender: "female" },
      { id: "af_river", name: "River (Female / US)", gender: "female" },
      { id: "af_sarah", name: "Sarah (Female / US)", gender: "female" },
      { id: "af_sky", name: "Sky (Female / US)", gender: "female" },
      { id: "am_adam", name: "Adam (Male / US)", gender: "male" },
      { id: "am_echo", name: "Echo (Male / US)", gender: "male" },
      { id: "am_eric", name: "Eric (Male / US)", gender: "male" },
      { id: "am_fenrir", name: "Fenrir (Male / US)", gender: "male" },
      { id: "am_liam", name: "Liam (Male / US)", gender: "male" },
      { id: "am_michael", name: "Michael (Male / US)", gender: "male" },
      { id: "am_onyx", name: "Onyx (Male / US)", gender: "male" },
      { id: "am_puck", name: "Puck (Male / US)", gender: "male" },
      { id: "bf_alice", name: "Alice (Female / UK)", gender: "female" },
      { id: "bf_emma", name: "Emma (Female / UK)", gender: "female" },
      { id: "bf_isabella", name: "Isabella (Female / UK)", gender: "female" },
      { id: "bf_lily", name: "Lily (Female / UK)", gender: "female" },
      { id: "bm_daniel", name: "Daniel (Male / UK)", gender: "male" },
      { id: "bm_fable", name: "Fable (Male / UK)", gender: "male" },
      { id: "bm_george", name: "George (Male / UK)", gender: "male" },
      { id: "bm_lewis", name: "Lewis (Male / UK)", gender: "male" },
    ],
  },
];

/**
 * Local implementation of TtsService (D3, R3, R6).
 * Sends standard OpenAI-compatible audio speech synthesis requests to local endpoints (e.g. Kokoro-FastAPI)
 * without requiring API authentication tokens.
 */
export class LocalTtsAdapter implements TtsService {
  constructor(
    private readonly baseUrl?: string,
    private readonly fetchFn: typeof fetch = globalThis.fetch.bind(globalThis),
  ) {}

  async listModels(): Promise<TtsModel[]> {
    return POPULAR_LOCAL_TTS_MODELS;
  }

  async synthesizeSpeech(
    request: SynthesizeSpeechRequest,
  ): Promise<SynthesizeSpeechResult> {
    if (!request.text || request.text.trim().length === 0) {
      throw new Error("El texto a sintetizar no puede estar vacío.");
    }

    const endpoint = resolveLocalTtsBaseUrl(request.baseUrl || this.baseUrl);
    const model = request.model || "kokoro";
    const voice = request.voice || "af_heart";
    const responseFormat = request.format || "mp3";
    const speed = request.speed ?? 1.0;

    const payload = {
      model,
      input: request.text,
      voice,
      response_format: responseFormat,
      speed,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (request.apiKey && request.apiKey.trim().length > 0) {
      headers.Authorization = `Bearer ${request.apiKey.trim()}`;
    }

    let response: Response;
    try {
      response = await this.fetchFn(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    } catch (netErr) {
      throw new Error(
        `No se pudo conectar al servicio local de TTS en '${endpoint}': ${netErr instanceof Error ? netErr.message : String(netErr)}`,
      );
    }

    if (!response.ok) {
      let errorMsg = `Error del servicio local TTS (${response.status} ${response.statusText})`;
      try {
        const errorJson = (await response.json()) as {
          error?: { message?: string } | string;
          detail?: string;
        };
        if (typeof errorJson?.error === "string") {
          errorMsg = `${errorMsg}: ${errorJson.error}`;
        } else if (
          typeof errorJson?.error === "object" &&
          errorJson.error?.message
        ) {
          errorMsg = `${errorMsg}: ${errorJson.error.message}`;
        } else if (errorJson?.detail) {
          errorMsg = `${errorMsg}: ${errorJson.detail}`;
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
