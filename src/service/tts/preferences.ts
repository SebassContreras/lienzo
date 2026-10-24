/**
 * Browser UI preferences persistence for Text-to-Speech (D3, R5).
 * Follows Principle 1 (SRP) and Principle 4 (KISS/YAGNI).
 *
 * Saves and restores user selections in `localStorage` so creators don't need
 * to reconfigure models, voices, speed, or options between runs.
 */

import {
  DEFAULT_TTS_MODEL,
  DEFAULT_TTS_VOICE,
  STORAGE_KEY_OPENROUTER_API_KEY,
} from "./config.ts";

const STORAGE_KEY_TTS_PREFERENCES = "lienzo_tts_ui_preferences";

export interface TtsUiPreferences {
  provider?: "openrouter" | "local" | "kokoro" | "custom";
  apiKey?: string;
  model: string;
  voice: string;
  speed: number;
  generateSubtitles: boolean;
  adjustDuration: boolean;
  isCustomModel?: boolean;
  isCustomVoice?: boolean;
}

export const DEFAULT_TTS_PREFERENCES: TtsUiPreferences = {
  provider: "openrouter",
  model: DEFAULT_TTS_MODEL,
  voice: DEFAULT_TTS_VOICE,
  speed: 1.0,
  generateSubtitles: true,
  adjustDuration: true,
  isCustomModel: false,
  isCustomVoice: false,
};

/**
 * Loads saved TTS preferences from localStorage with fallback to defaults.
 */
export function loadTtsPreferences(): TtsUiPreferences {
  if (typeof window === "undefined" || !window.localStorage) {
    return { ...DEFAULT_TTS_PREFERENCES };
  }

  let prefs: Partial<TtsUiPreferences> = {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_TTS_PREFERENCES);
    if (raw) {
      prefs = JSON.parse(raw);
    }
  } catch {
    // Fall back to defaults on parse error or security restriction
  }

  // 061/D3: a key in the old separate slot moves into the preferences once.
  let apiKey = prefs.apiKey;
  try {
    const legacyKey = window.localStorage
      .getItem(STORAGE_KEY_OPENROUTER_API_KEY)
      ?.trim();
    if (legacyKey !== undefined) {
      window.localStorage.removeItem(STORAGE_KEY_OPENROUTER_API_KEY);
      if (!apiKey && legacyKey) {
        apiKey = legacyKey;
        window.localStorage.setItem(
          STORAGE_KEY_TTS_PREFERENCES,
          JSON.stringify({ ...prefs, apiKey }),
        );
      }
    }
  } catch {
    // Ignore
  }

  return {
    provider: prefs.provider || DEFAULT_TTS_PREFERENCES.provider,
    apiKey: apiKey || "",
    model: prefs.model || DEFAULT_TTS_PREFERENCES.model,
    voice: prefs.voice || DEFAULT_TTS_PREFERENCES.voice,
    speed:
      typeof prefs.speed === "number"
        ? prefs.speed
        : DEFAULT_TTS_PREFERENCES.speed,
    generateSubtitles:
      typeof prefs.generateSubtitles === "boolean"
        ? prefs.generateSubtitles
        : DEFAULT_TTS_PREFERENCES.generateSubtitles,
    adjustDuration:
      typeof prefs.adjustDuration === "boolean"
        ? prefs.adjustDuration
        : DEFAULT_TTS_PREFERENCES.adjustDuration,
    isCustomModel: Boolean(prefs.isCustomModel),
    isCustomVoice: Boolean(prefs.isCustomVoice),
  };
}

/**
 * Saves current TTS preferences to localStorage.
 */
export function saveTtsPreferences(prefs: Partial<TtsUiPreferences>): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    const current = loadTtsPreferences();
    const updated: TtsUiPreferences = {
      ...current,
      ...prefs,
    };
    window.localStorage.setItem(
      STORAGE_KEY_TTS_PREFERENCES,
      JSON.stringify(updated),
    );
  } catch {
    // Ignore localStorage quota or private-mode errors
  }
}
