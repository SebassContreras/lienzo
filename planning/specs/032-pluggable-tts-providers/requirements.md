# 032 — pluggable-tts-providers — Requirements

## What's being built

Pluggable Text-to-Speech (TTS) provider architecture supporting both cloud (OpenRouter) and local/self-hosted TTS engines (such as Kokoro or any OpenAI-compatible audio speech endpoint) through a unified service abstraction:
- Unified provider interface (`TtsService`) so callers (tools, CLI, UI) interact with any speech provider uniformly without code differences.
- Configuration via environment variables (`.env`): configurable provider selection (`TTS_PROVIDER=openrouter|local|custom`), local endpoint URL (`TTS_LOCAL_URL` or `KOKORO_TTS_URL`), port, and optional local model/voice defaults.
- Provider factory (`getTtsService()` / provider resolver) that instantiates the active adapter based on explicit parameters or environment configuration.
- Seamless fallback cascade: explicit request parameters -> environment variables -> provider defaults.
- Compatibility across all existing consumers: `scene_generate_speech` tool, CLI, MCP server, and editor modal (`tts-dialog.tsx`) without breaking existing OpenRouter functionality.

## Who it serves

- Creators and developers running local TTS engines (like Kokoro TTS or other local servers) to synthesize audio without external cloud API dependencies, costs, or internet access.
- Users wanting to switch seamlessly between OpenRouter and local TTS engines via `.env` or UI settings.

## Requirements

- R1@1: Provider selection via environment variable `TTS_PROVIDER` (supporting values such as `openrouter`, `local`, `kokoro`, `custom`), defaulting to `openrouter` when unspecified.
- R2@1: Local TTS endpoint configuration via environment variables `TTS_LOCAL_URL` (or `KOKORO_TTS_URL`), allowing arbitrary host/port configurations (e.g. `http://localhost:8880/v1/audio/speech` or custom local URLs) without hardcoded ports.
- R3@1: Pluggable adapter / factory layer providing a concrete `LocalTtsAdapter` implementing `TtsService`, handling requests to local endpoints without requiring an API key.
- R4@1: Unified tool interface: `scene_generate_speech` retains its existing contract while accepting an optional `provider` parameter and routing requests through the provider factory.
- R5@1: Editor UI integration in `tts-dialog.tsx`: allow selecting between available providers (OpenRouter vs Local) and adapt input requirements (API key not required when using local provider).
- R6@1: Local voice and model presets for Kokoro / local engines alongside custom text inputs.

## Out of scope

- Bundling or installing the local Kokoro binary / Python environment inside the Lienzo repository.
- Audio streaming / chunked websockets for live playback before full generation.

## Dependencies

028, 030.

## Owner split

All tasks agent.
