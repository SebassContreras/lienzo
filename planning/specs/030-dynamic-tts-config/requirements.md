# 030 — dynamic-tts-config — Requirements

## What's being built

Dynamic runtime configuration and flexible model/voice selection for OpenRouter Text-to-Speech (TTS):
- Zero-rebuild environment loading from `.env` in Node/CLI and Vite.
- Configurable base API URL (`OPENROUTER_API_BASE_URL`) for proxies and alternative endpoints.
- Dynamic UI controls with presets plus open custom text inputs for arbitrary models and voices.
- Session persistence in `localStorage` for UI testing preferences.
- Flexible fallback cascade from CLI/MCP flags -> environment variables (`.env`) -> UI preferences -> default fallbacks.

## Who it serves

- Creators and developers testing and comparing multiple speech models, voices, and endpoints rapidly without rebuilding or restarting the app.
- Agents and automated scripts that want custom or environment-configured TTS defaults.

## Requirements

- R1@1: Runtime environment loading in Node/CLI via native `process.loadEnvFile` and client-side Vite variable resolution (`import.meta.env.VITE_OPENROUTER_*`) supporting `OPENROUTER_API_KEY`, `OPENROUTER_API_BASE_URL`, `OPENROUTER_TTS_MODEL`, and `OPENROUTER_TTS_VOICE` without requiring re-compilation.
- R2@1: Configurable base URL: allow overriding the speech API endpoint URL via `OPENROUTER_API_BASE_URL` or request options (falling back to `https://openrouter.ai/api/v1/audio/speech`).
- R3@1: Dynamic model selection in the web editor modal (`tts-dialog.tsx`), including standard presets and a free-form custom input to enter any arbitrary model ID.
- R4@1: Dynamic voice selection in the web editor modal, offering preset voices for known models and text input for custom voices.
- R5@1: Browser preference persistence in `localStorage` storing the user's last selected model, voice, speed, and options so re-testing requires zero repetitive setup.
- R6@1: CLI and MCP `scene_generate_speech` tool resolves defaults from environment variables when flags/arguments are omitted, while retaining full per-call flag override capability.

## Out of scope

- Managing multiple named API key profiles or billing dashboards.

## Dependencies

028.

## Owner split

All tasks agent.
