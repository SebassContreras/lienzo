import {
  resolveLocalTtsBaseUrl,
  resolveLocalTtsModel,
  resolveLocalTtsVoice,
} from "./config.ts";
import type {
  SynthesizeSpeechRequest,
  SynthesizeSpeechResult,
  TtsModel,
  TtsService,
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
  {
    id: "kokoro-es",
    name: "Kokoro Español (Local)",
    provider: "Kokoro",
    voices: [
      {
        id: "ef_dora",
        name: "Dora (Femenina / ES)",
        gender: "female",
        language: "es",
      },
      {
        id: "em_alex",
        name: "Alex (Masculina / ES)",
        gender: "male",
        language: "es",
      },
      {
        id: "em_santa",
        name: "Santa (Masculina / ES)",
        gender: "male",
        language: "es",
      },
    ],
  },
];

/** Every voice id the local models list. */
const KNOWN_VOICES = POPULAR_LOCAL_TTS_MODELS.flatMap((m) =>
  m.voices.map((v) => v.id),
);

/**
 * When `voice` names a voice no local model lists, the list to pick from (069/D12); a Kokoro
 * mix (`af_bella+af_sky(0.5)`) is checked part by part.
 */
export function unknownVoiceHint(
  voice: string,
  known: readonly string[] = KNOWN_VOICES,
): string {
  const parts = voice.split("+").map((p) => p.replace(/\(.*\)$/, "").trim());
  const unknown = parts.filter((p) => !known.includes(p));
  return unknown.length === 0
    ? ""
    : `La voz «${unknown.join("», «")}» no está en la lista; voces: ${known.join(", ")}`;
}

/**
 * The voice ids a Kokoro-FastAPI server lists at `GET /v1/audio/voices` (`{ voices: [...] }`,
 * names or `{ id }`/`{ name }`), next to its speech endpoint; undefined when it lists none.
 */
function parseVoices(body: unknown): string[] | undefined {
  const voices = (body as { voices?: unknown })?.voices;
  if (!Array.isArray(voices)) return undefined;
  const ids = voices
    .map((v) =>
      typeof v === "string"
        ? v
        : ((v as { id?: unknown; name?: unknown })?.id ??
          (v as { name?: unknown })?.name),
    )
    .filter((v): v is string => typeof v === "string");
  return ids.length > 0 ? ids : undefined;
}

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

  /** The server's voices, asked once per speech endpoint (071/D6). */
  private readonly voices = new Map<string, Promise<string[] | undefined>>();

  private serverVoices(endpoint: string): Promise<string[] | undefined> {
    if (!/\/speech\/?$/.test(endpoint)) return Promise.resolve(undefined);
    let list = this.voices.get(endpoint);
    if (!list) {
      const url = endpoint.replace(/\/speech\/?$/, "/voices");
      list = this.fetchFn(url, { method: "GET" })
        .then(async (r) => (r.ok ? parseVoices(await r.json()) : undefined))
        .catch(() => undefined);
      this.voices.set(endpoint, list);
    }
    return list;
  }

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
    const model = resolveLocalTtsModel(request.model);
    const voice = resolveLocalTtsVoice(request.voice);
    const responseFormat = request.format || "mp3";
    const speed = request.speed ?? 1.0;
    // an unknown voice fails here, before the server's own error (071/D6)
    const listed = await this.serverVoices(endpoint);
    const hint = listed ? unknownVoiceHint(voice, listed) : "";
    if (hint) throw new Error(hint);

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
      // the server's raw text (request ids, URLs) is left out when the voice is the cause
      const voiceHint = unknownVoiceHint(voice);
      throw new Error(
        voiceHint
          ? `Error del servicio local TTS (${response.status}): ${voiceHint}`
          : errorMsg,
      );
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
