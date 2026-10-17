# 037 — voice-library-integration — Design

## Approach

- ~~D1@1 (implements R1, R2): Add an action element item "Voz con IA" to the basic elements toolbar (src/editor/app.tsx & src/editor/library.tsx) that triggers the TTS modal dialog (TtsDialog) directly with pre-populated voice provider and script inputs.~~ retired 2026-10-17
- D2@1 (implements R3): Ensure TTS generated audio binary data is strictly saved as unversioned content-addressed files under `assets/` (via `src/presets/store.ts:uploadAsset` and `src/service/tts/asset-store.ts:saveAudioAsset`), attaching `/assets/<hash>.<ext>` to the scene audio tracks (`scene.audioTracks` / `scene.audio`) without committing audio binaries to git.
- ~~D3@1 (implements R4): Add a pure voice preset model and schema in src/model/voice-preset.ts (VoicePresetSchema) representing reusable voiceover configurations (name, category: "Voces", provider, model, voice, speed, custom flags) and register built-in voice presets in presets/built-in/.~~ retired 2026-10-17
- ~~D4@1 (implements R4, R5): Extend preset loading and application in src/presets/store.ts and src/editor/app.tsx to handle the dedicated Voces preset category.~~ retired 2026-10-17
- ~~D5@1 (implements R4): Provide a "Guardar como preset de voz" action in src/editor/dialogs/tts-dialog.tsx allowing creators to capture their current voice setup directly into the "Voces" library category.~~ retired 2026-10-17
- D6@1 (implements R2): The TTS modal dialog (`TtsDialog`) is opened exclusively from the primary "Voz con IA" button in the editor top bar (`header.topbar`), without polluting basic elements or preset categories.

## Trade-offs & Mitigations

- **Decision 1:** "Voz con IA" as an action button in the basic elements toolbar vs. registering a dummy `voice` element kind.
  - *Pros:* Adheres to P1 (SRP) and P4 (KISS/YAGNI). Audio and speech in Lienzo are scene-level audio tracks (`scene.audioTracks`), not 2D canvas elements with position or draw loops.
  - *Cons:* The basic elements toolbar historically rendered only canvas elements.
  - *Mitigation:* Allow the basics library section to support action items with a distinct callback (`onTriggerAction`), rendering seamlessly alongside Rectángulo, Texto, and Ícono with Lucide `Mic` icon.
- **Decision 2:** Voice presets stored as JSON recipes in `presets/` under category "Voces" vs. separate storage endpoint.
  - *Pros:* Adheres to P2 (DRY) and P6 (Standards). Reuses the existing JSON preset store (`/api/presets`), preset filtering, search, export, and rename infrastructure without redundant API routes.
  - *Cons:* Preset recipes are validated with Zod for element/background kinds.
  - *Mitigation:* Define `VoicePreset` schema and integrate it cleanly into preset parsing/store helpers so voice presets persist standard metadata (provider, model, voice ID, speed) without binary audio payloads.
- **Decision 3:** Storage of generated audio binaries exclusively in `assets/`.
  - *Pros:* Complies with P3 (Service Layer / Anti-Corruption) and R3; preserves git repository performance and lightweight git clones.
  - *Cons:* Binary assets must be resolved locally via Vite asset middleware (`/assets/*`).
  - *Mitigation:* Existing `.gitignore` rules already ignore `assets/*` (except `.gitkeep`); `uploadAsset` and `saveAudioAsset` compute SHA hashes for deterministic asset deduplication.

## Deliverables

- `src/model/voice-preset.ts`: Type definitions and Zod validation schema for voice presets.
- `src/model/voice-preset.test.ts`: Unit tests verifying voice preset parsing, validation, and serialization.
- `src/editor/library.tsx`: Action button support in basic elements toolbar for "Voz con IA".
- `src/editor/dialogs/tts-dialog.tsx`: Pre-population handling and "Guardar como preset de voz" button.
- `src/editor/app.tsx`: Integration of "Voz con IA" toolbar action, "Voces" category preset handling, and voice preset application.
- `presets/built-in/45-voz-narrador-es.json`: Built-in voice preset recipe under "Voces" category.
- `src/editor/voice-library.test.ts`: Verification tests for toolbar integration, preset application, and git-free asset persistence.

## Sequencing

1. Voice preset schema and domain model (T001, T002).
2. Built-in voice preset recipe and store resolution (T003).
3. "Voz con IA" toolbar action in basic elements library (T004).
4. TTS dialog preset saving and application wiring (T005).
5. Comprehensive integration and verification tests (T006).
