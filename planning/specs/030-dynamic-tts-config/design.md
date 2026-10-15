# 030 — dynamic-tts-config — Design

## Approach

- D1@1 (implements R1, R2): Runtime environment configuration resolver (`src/service/tts/config.ts`) that loads `.env` safely via native `process.loadEnvFile` in Node without throwing if missing, and resolves `apiKey`, `baseUrl`, `defaultModel`, and `defaultVoice` checking environment variables across Node (`process.env`) and Vite (`import.meta.env`).
- D2@1 (implements R2): OpenRouter TTS adapter (`src/service/tts/openrouter-adapter.ts`) supports dynamic base URL resolution from config/env with fallback to `https://openrouter.ai/api/v1/audio/speech` and per-request `baseUrl` override.
- D3@1 (implements R5): A dedicated UI preferences helper (`src/service/tts/preferences.ts`) separating browser `localStorage` management (for model, voice, speed, subtitles, adjustDuration, apiKey) from core service config, ensuring high cohesion and SRP.
- D4@1 (implements R3, R4): Editor TTS modal dialog (`src/editor/dialogs/tts-dialog.tsx`) provides dynamic model & voice selection with presets plus custom text input switches and auto-restores saved preferences.
- D5@1 (implements R6): Service tool `scene_generate_speech` (`src/service/tools/scene-generate-speech.ts`) resolves model, voice, and base URL defaults from runtime environment configuration when omitted.

## Trade-offs & Mitigations

- **Decision:** Native Node `process.loadEnvFile()` vs external `dotenv`.
  - *Pros:* Zero dependencies, native in Node 20.12+ and Node 24 (Lienzo runtime), instant execution.
  - *Cons:* Throws if `.env` does not exist; does not override pre-set environment variables.
  - *Mitigation:* Safely call inside try/catch ignoring ENOENT; existing shell variables taking precedence is standard 12-factor app behavior.
- **Decision:** Dedicated `preferences.ts` vs monolithic `config.ts`.
  - *Pros:* Adheres to SRP (Principle 1); client browser UI persistence is kept decoupled from service-level runtime env resolution.
  - *Cons:* Additional small file.
  - *Mitigation:* Lightweight, pure functions with testable contract (Principle 4 & 5).
- **Decision:** Free-form custom text input for model & voice alongside presets.
  - *Pros:* Creators and agents can use newly released models or custom voices on OpenRouter without code changes.
  - *Cons:* User can type an invalid model ID.
  - *Mitigation:* Clear error reporting from OpenRouter API returned in the UI or CLI error response.

## Deliverables

- `src/service/tts/config.ts`: Safe `.env` loading and environment variable resolution for API key, base URL, default model, and default voice.
- `src/service/tts/preferences.ts`: Client-side UI preferences persistence in `localStorage`.
- `src/service/tts/openrouter-adapter.ts`: Configurable base URL support.
- `src/editor/dialogs/tts-dialog.tsx`: Dynamic model/voice selection with presets, custom inputs, and preference restoration.
- `src/service/tools/scene-generate-speech.ts`: Resolution of defaults from environment variables.
- `src/service/tts/tts-config.test.ts`: Unit test suite verifying env resolution, adapter URLs, preferences, and tool defaults.

## Sequencing

1. Runtime environment loader and config resolution (`src/service/tts/config.ts`).
2. Configurable base URL support in `OpenRouterTtsAdapter`.
3. Dedicated `preferences.ts` for browser localStorage persistence.
4. Dynamic model/voice selection & preference restoration in `tts-dialog.tsx`.
5. Environment-based defaults resolution in `scene_generate_speech`.
6. Unit tests covering all requirements.
