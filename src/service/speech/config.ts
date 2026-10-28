/**
 * OpenRouter configuration loader, environment resolution, and runtime defaults (D1, R1, R2).
 * Follows Principle 1 (SRP) and Principle 3 (Anti-Corruption / Dependency Inversion).
 *
 * Resolves configuration following precedence:
 * 1. Explicit override passed in options (e.g. CLI flag, tool argument, dialog input)
 * 2. Process environment variables (`process.env.OPENROUTER_*`) loaded via native `process.loadEnvFile`
 * 3. Hardcoded default fallbacks
 *
 * The environment is read in Node only: no `OPENROUTER_*` value reaches browser code; the
 * editor reaches OpenRouter through the dev server's proxy (`TTS_PROXY_PATH`, 046/D4).
 */

export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/audio/speech";
/** The dev server's speech endpoint that adds the server's API key (046/D4). */
export const TTS_PROXY_PATH = "/api/tts/speech";
export const DEFAULT_LOCAL_TTS_URL = "http://localhost:8880/v1/audio/speech";
/** The old separate key slot, read once to migrate it into the TTS preferences (061/D3). */
export const STORAGE_KEY_OPENROUTER_API_KEY = "lienzo_openrouter_api_key";
export const DEFAULT_TTS_MODEL = "openai/tts-1";
export const DEFAULT_TTS_VOICE = "alloy";
export const DEFAULT_LOCAL_TTS_MODEL = "kokoro-es";
export const DEFAULT_LOCAL_TTS_VOICE = "ef_dora";

export type TtsProviderType = "openrouter" | "local" | "kokoro" | "custom";

/**
 * Safely loads environment variables from a .env file using native Node.js
 * `process.loadEnvFile()` if supported (Node 20.12+, Node 24).
 * Silently ignores ENOENT if the file does not exist.
 */
export function loadEnvSafely(envPath?: string): void {
  if (
    typeof process !== "undefined" &&
    typeof (process as unknown as { loadEnvFile?: (path?: string) => void })
      .loadEnvFile === "function"
  ) {
    try {
      const loader = (
        process as unknown as { loadEnvFile: (path?: string) => void }
      ).loadEnvFile;
      if (envPath) {
        loader(envPath);
      } else {
        loader();
      }
    } catch {
      // Ignore missing .env or unreadable file errors
    }
  }
}

// Automatically load default .env if running in Node
loadEnvSafely();

/** An environment variable, trimmed, from `process.env` (Node only; undefined in a browser). */
function getEnvVariable(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  const val = process.env?.[name]?.trim();
  return val ? val : undefined;
}

/**
 * Resolves the OpenRouter API key from an explicit value (the editor passes the key saved in
 * its TTS preferences), else `process.env` in Node.
 */
export function resolveOpenRouterApiKey(explicitKey?: string): string {
  if (explicitKey && explicitKey.trim().length > 0) {
    return explicitKey.trim();
  }

  // Environment check (Node only)
  const envKey = getEnvVariable("OPENROUTER_API_KEY");
  if (envKey) return envKey;

  return "";
}

/**
 * Resolves the active TTS provider.
 * Falls back to the TTS_PROVIDER env var, then "openrouter".
 */
export function resolveTtsProvider(explicitProvider?: string): TtsProviderType {
  if (explicitProvider && explicitProvider.trim().length > 0) {
    const norm = explicitProvider.trim().toLowerCase();
    if (norm === "local" || norm === "kokoro" || norm === "custom") {
      return norm as TtsProviderType;
    }
    return "openrouter";
  }

  const envProvider = getEnvVariable("TTS_PROVIDER");
  if (envProvider) {
    const norm = envProvider.trim().toLowerCase();
    if (norm === "local" || norm === "kokoro" || norm === "custom") {
      return norm as TtsProviderType;
    }
  }

  return "openrouter";
}

/**
 * Resolves the local/Kokoro speech API base URL.
 * Falls back to TTS_LOCAL_URL, KOKORO_TTS_URL, then DEFAULT_LOCAL_TTS_URL.
 */
export function resolveLocalTtsBaseUrl(explicitBaseUrl?: string): string {
  if (explicitBaseUrl && explicitBaseUrl.trim().length > 0) {
    return explicitBaseUrl.trim();
  }

  const envUrl =
    getEnvVariable("TTS_LOCAL_URL") || getEnvVariable("KOKORO_TTS_URL");
  if (envUrl) return envUrl;

  return DEFAULT_LOCAL_TTS_URL;
}

/** The local provider's model: explicit, else KOKORO_TTS_MODEL, else "kokoro-es" (046/D5). */
export function resolveLocalTtsModel(explicitModel?: string): string {
  return (
    explicitModel?.trim() ||
    getEnvVariable("KOKORO_TTS_MODEL") ||
    DEFAULT_LOCAL_TTS_MODEL
  );
}

/** The local provider's voice: explicit, else KOKORO_TTS_VOICE, else "ef_dora" (046/D5). */
export function resolveLocalTtsVoice(explicitVoice?: string): string {
  return (
    explicitVoice?.trim() ||
    getEnvVariable("KOKORO_TTS_VOICE") ||
    DEFAULT_LOCAL_TTS_VOICE
  );
}

/**
 * Resolves the OpenRouter speech API base URL.
 * Falls back to OPENROUTER_API_BASE_URL env var, then default OPENROUTER_API_URL.
 */
export function resolveOpenRouterBaseUrl(explicitBaseUrl?: string): string {
  if (explicitBaseUrl && explicitBaseUrl.trim().length > 0) {
    return explicitBaseUrl.trim();
  }

  const envUrl = getEnvVariable("OPENROUTER_API_BASE_URL");
  if (envUrl) return envUrl;

  return OPENROUTER_API_URL;
}

/**
 * Resolves the default TTS model name.
 * Falls back to OPENROUTER_TTS_MODEL env var, then "openai/tts-1".
 */
export function resolveDefaultTtsModel(explicitModel?: string): string {
  if (explicitModel && explicitModel.trim().length > 0) {
    return explicitModel.trim();
  }

  const envModel = getEnvVariable("OPENROUTER_TTS_MODEL");
  if (envModel) return envModel;

  return DEFAULT_TTS_MODEL;
}

/**
 * Resolves the default TTS voice name.
 * Falls back to OPENROUTER_TTS_VOICE env var, then "alloy".
 */
export function resolveDefaultTtsVoice(explicitVoice?: string): string {
  if (explicitVoice && explicitVoice.trim().length > 0) {
    return explicitVoice.trim();
  }

  const envVoice = getEnvVariable("OPENROUTER_TTS_VOICE");
  if (envVoice) return envVoice;

  return DEFAULT_TTS_VOICE;
}
