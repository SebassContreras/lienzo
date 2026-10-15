# 032 — pluggable-tts-providers — Design

## Approach

- D1@1 (implements R1, R3): Define a provider-agnostic factory function `createTtsService(options)` that instantiates either `OpenRouterTtsAdapter` or `LocalTtsAdapter` based on the specified provider name or runtime configuration.
- D2@1 (implements R1, R2): Add configuration resolver functions `resolveTtsProvider()` and `resolveLocalTtsBaseUrl()` in `src/service/tts/config.ts` supporting `TTS_PROVIDER`, `TTS_LOCAL_URL`, `KOKORO_TTS_URL`, and `VITE_*` equivalents with fallback to default OpenAI-compatible local audio endpoint (`http://localhost:8880/v1/audio/speech`).
- D3@1 (implements R3, R6): Implement `LocalTtsAdapter` in `src/service/tts/local-adapter.ts` fulfilling `TtsService`, sending standard OpenAI-compatible `/audio/speech` requests without requiring an API key header, and listing Kokoro/local voice and model presets.
- D4@1 (implements R4): Update `scene_generate_speech` tool to accept an optional `provider: z.enum(["openrouter", "local", "kokoro", "custom"]).optional()` and use the provider factory to resolve the active service.
- D5@1 (implements R5, R6): Update `tts-dialog.tsx` in the web editor with a provider selector tab/dropdown, conditionally displaying the API key warning only when using OpenRouter, and providing Kokoro voice presets when Local provider is selected.

## Deliverables

- `src/service/tts/local-adapter.ts`
- `src/service/tts/factory.ts`
- `src/service/tts/config.ts` (extended with provider and local URL resolvers)
- `src/service/tools/scene-generate-speech.ts` (updated with provider input and factory)
- `src/editor/dialogs/tts-dialog.tsx` (updated with provider selection and dynamic voices)
- `src/service/tts/pluggable-tts.test.ts` (unit tests covering local adapter, factory, and resolution)

## Sequencing

1. Config & resolver functions (`config.ts`).
2. `LocalTtsAdapter` (`local-adapter.ts`).
3. Factory resolver (`factory.ts`).
4. Tool integration in `scene-generate-speech.ts`.
5. Editor dialog UI integration (`tts-dialog.tsx`).
6. Unit tests.

## Trade-offs

- Factory vs Direct Dependency Injection:
  - Pros: A single `createTtsService` factory keeps callers (`scene_generate_speech`, `tts-dialog.tsx`, CLI/MCP) completely decoupled from vendor adapters while providing uniform fallback logic (environment variables -> explicit parameters).
  - Cons: Introduces an additional factory layer (`factory.ts`).
  - Mitigation: Keep the factory lightweight (~30 lines), purely functional, and allow direct adapter injection via options for unit tests.

- OpenAI-compatible endpoint schema for Local/Kokoro:
  - Pros: Kokoro FastAPI and standard self-hosted local TTS services natively mirror the OpenAI `/v1/audio/speech` JSON payload (`model`, `input`, `voice`, `response_format`, `speed`), ensuring seamless interoperability without custom proprietary schemas.
  - Cons: Custom local scripts with unconventional HTTP routes might require custom base URLs or proxies.
  - Mitigation: `TTS_LOCAL_URL` accepts any arbitrary URL path, and `resolveLocalTtsBaseUrl` handles full path overrides.
