# 036 — subtitles-speech-sync — Design

## Approach

- D1@2 (implements R1, R2): Add pure mathematical synchronization helpers in `src/engine/subtitles/sync.ts` (`scaleSubtitleTimings(cues, speedFactor, originTime?)` and `offsetSubtitleTimings(cues, deltaSeconds)`) that immutably rescale and shift cues without overengineering.
- ~~D2@1 (implements R3): Add a pure audio duration fitting helper calculateFitSpeedRatio in src/engine/subtitles/sync.ts.~~ retired 2026-10-17
- D3@3 (implements R1, R6): `src/editor/widgets/cues-editor.tsx` integrates text-based pause tokens and gap-detection on file import, rendering plain text on canvas while showing pause timings in the editor.
- D4@1 (implements R5): Retain global canvas time `t` indexing for subtitle element transforms and keyframe tracks (`src/engine/tracks.ts`), ensuring `drawSubtitles` visual rendering reads scaled cue timestamps without altering timeline playback clock semantics.
- D5@1 (implements R1, R6): Pure conversion functions in `src/engine/subtitles/pauses.ts` (`parseTextWithPauses` and `cuesToTextWithPauses`) that translate between timed words and pause-tokenized text immutably with configurable silence thresholds.

## Trade-offs & Mitigations

- **Decision 1:** Discrete recalculation of cue and word timestamps upon applying speed/shift vs. dynamic runtime time dilation inside `drawSubtitles`.
  - *Pros:* Adheres to Principle 1 & 4 (SRP, KISS); cues remain the single source of truth; compatible with standard SRT/VTT exports and standalone playback without duplicating time-mapping logic across all renderers.
  - *Cons:* Destructive if previous original timing values are lost on consecutive re-scalings.
  - *Mitigation:* Store the active `speed` factor and base timings cleanly or allow relative/proportional updates with Undo/Redo (`src/editor/app.tsx` history stack).
- **Decision 2:** Pure synchronization service module (`src/engine/subtitles/sync.ts`) separated from React UI components.
  - *Pros:* Principle 1 & 5 (High cohesion, low coupling, pure functions); fully testable via fast Vitest unit tests in Node and usable by headless rendering/CLI/MCP without DOM or browser dependencies.
  - *Cons:* Requires bridging state updates back through `onChange` in inspector widgets.
  - *Mitigation:* Standard immutable updater callbacks in `CuesEditor`.
- **Decision 3:** Audio duration retrieval via `getSceneAudioTracks(scene)` and asset metadata instead of binding to raw HTMLAudioElement or Web Audio nodes.
  - *Pros:* Principle 3 & 4 (Dependency Inversion / Anti-Corruption); keeps subtitle domain free from browser audio hardware state or playback concurrency.
  - *Cons:* Audio asset duration must be available from cached asset metadata or scene duration.
  - *Mitigation:* Graceful fallback to `scene.duration` or prompt when audio asset is still loading.

## Deliverables

- `src/engine/subtitles/sync.ts`: Pure timestamp scaling, shifting, and speed ratio fitting calculations.
- `src/engine/subtitles/sync.test.ts`: Unit tests covering cue/word scaling, negative shifts, origin anchoring, and precision rounding.
- `src/components/subtitles/descriptor.ts`: Component field declarations for synchronization controls.
- `src/editor/widgets/cues-editor.tsx`: UI controls for speed factor, global offset, and "Ajustar al audio".
- `src/engine/subtitles/cue-timing.test.ts`: Verification tests confirming keyframe tracks and playhead `t` alignment.

## Sequencing

1. Pure mathematical synchronization logic and unit tests (T001, T002).
2. Audio fit ratio calculation helper and tests (T003).
3. Inspector UI controls and widget integration (T004, T005).
4. Subtitle rendering and keyframe clock verification tests (T006).
