# 028 — voice-tts — Design

## Approach

- D1@1 (implements R1): An environment / configuration helper (`src/service/tts/config.ts`) resolves the OpenRouter API key from `OPENROUTER_API_KEY` (in Node/CLI process.env or `.env.local`) with fallback to local storage settings in the editor UI.
- D2@1 (implements R2, R3): A domain `TtsService` interface (`src/service/tts/types.ts`) decouples speech synthesis from external vendors; `OpenRouterTtsAdapter` (`src/service/tts/openrouter-adapter.ts`) implements it by querying `https://openrouter.ai/api/v1/audio/speech`, saving the resulting audio buffer into `assets/` via the content-hashed asset store.
- D3@1 (implements R4): Audio attachment logic updates `scene.audio` with the generated asset ID and optionally adjusts `scene.duration` to match the exact duration of the synthesized audio buffer.
- D4@1 (implements R5): A pure speech-alignment helper (`src/service/tts/speech-alignment.ts`) converts the input text script into timed `SubtitleCue[]` (with proportional sentence and word estimates based on audio duration), creating or updating a `subtitles` component on the canvas.
- D5@1 (implements R6): A service tool `scene_generate_speech` (`src/service/tools/scene-generate-speech.ts`) exposes speech generation to CLI and MCP, taking script, voice, model, and optional subtitle creation flags.
- D6@1 (implements R2): The editor UI provides a voice generation modal dialog (`src/editor/dialogs/tts-dialog.tsx`) allowing users to input script text, select model and voice, test generation, and attach the voiceover to the canvas scene.

## Trade-offs & Mitigations

- **Decision:** Dependency inversion via `TtsService` interface and `OpenRouterTtsAdapter`.
  - *Pros:* Fully decouples domain logic, CLI, MCP, and editor from OpenRouter's specific API shape; allows deterministic mock testing without live network calls.
  - *Cons:* Requires defining interfaces and an adapter wrapper.
  - *Mitigation:* Follows Architecture Guide rule 3 directly with minimal boilerplate (pure TypeScript interface).
- **Decision:** Proportional sentence and word duration estimation for subtitles.
  - *Pros:* Works universally with all OpenRouter TTS models (OpenAI, ElevenLabs, Gemini) without requiring extra phoneme alignment services.
  - *Cons:* Pauses in speech may slightly deviate from exact timing.
  - *Mitigation:* Cues are created as standard editable subtitle elements that creators can fine-tune in the inspector (spec 027).

## Deliverables

- `src/service/tts/types.ts`: `TtsService` interface, request/response models, voice presets.
- `src/service/tts/config.ts`: API key configuration loader.
- `src/service/tts/openrouter-adapter.ts`: OpenRouter Speech API adapter.
- `src/service/tts/speech-alignment.ts`: Pure script-to-cues generator with word-level estimation.
- `src/service/tools/scene-generate-speech.ts`: Service tool for CLI & MCP.
- `src/editor/dialogs/tts-dialog.tsx`: Editor TTS dialog UI.
- Unit tests: `src/service/tts/speech-alignment.test.ts`, `src/service/tts/openrouter-adapter.test.ts`.

## Sequencing

1. `TtsService` interface and config loader (T001).
2. Pure speech-to-subtitle alignment helper & tests (T002).
3. OpenRouter speech adapter with mocked API tests (T003).
4. Service tool `scene_generate_speech` (T004).
5. Scene duration adjustment & audio attachment logic (T005).
6. Editor TTS dialog UI (T006).
7. End-to-end integration test suite (T007).
