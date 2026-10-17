# 035 — multi-audio-tracks — Design

## Approach

- D1@1 (implements R1, R2): Add `AudioTrackItem` to `src/model/model.ts` and `AudioTrackItemSchema` to `src/model/schema.ts` (`id`, `assetId`, `name`, `volume`, `startOffset`, `trimOffset`, `muted`). Extend `Scene` and `SceneSchema` with `audioTracks?: AudioTrackItem[]`. Provide a pure normalization helper `getSceneAudioTracks(scene: Scene): AudioTrackItem[]` in `src/engine/audio/audio-tracks.ts` that normalizes legacy single-track `scene.audio` into `audioTracks` if `audioTracks` is absent or empty.
- D2@1 (implements R3, R4): Refactor the timeline audio UI (`src/editor/timeline/audio-track-control.tsx`) into a multi-track control panel supporting adding tracks via `+ Añadir audio`, track deletion, vertical reordering, mute toggle, volume sliders, start/trim offsets, and asset replacement, with Spanish labels per A16.
- D3@1 (implements R5): Enhance `WebAudioPlayer` (`src/engine/audio/audio-player.ts`) to manage multiple concurrent Web Audio source/gain node chains (one per active unmuted track in `audioTracks`), mixing tracks synchronously with playhead time `t`, scrubbing, and looping.
- D4@1 (implements R6): Add a pure audio mixing utility `mixAudioTracksForExport` in `src/engine/audio/audio-export.ts` to combine multiple audio track buffers into a single normalized composite `AudioBuffer`, and update `src/export/video-encoder.ts` and `src/export/render-page.ts` to multiplex the composite audio stream into MP4/WebM video exports.

## Trade-offs & Mitigations

- **Decision 1:** Normalization helper (`getSceneAudioTracks`) over in-place migration mutation.
  - *Pros:* Fully non-destructive and backward compatible with older JSON scenes; adheres to Principle 3 & 4 (KISS/YAGNI).
  - *Cons:* Consumers need to call `getSceneAudioTracks(scene)` when evaluating audio.
  - *Mitigation:* Centralize normalization in a single, well-tested pure helper function in `src/engine/audio/audio-tracks.ts`.
- **Decision 2:** Software mixing into a composite `AudioBuffer` for video export.
  - *Pros:* Generates a single, universally compatible audio stream across all video formats/codecs (AAC/Opus) and browser players; avoids multi-stream container desync or encoder incompatibilities.
  - *Cons:* Requires combining Float32 channel samples across tracks with appropriate clipping protection.
  - *Mitigation:* Pure function `mixAudioTracksForExport()` with float accumulation and clamping (`[-1, 1]`), covered by deterministic unit tests.

## Deliverables

- `src/model/model.ts`, `src/model/schema.ts`: `AudioTrackItem` type and Zod schema.
- `src/engine/audio/audio-tracks.ts`: Pure normalization and track manipulation helpers.
- `src/engine/audio/audio-player.ts`: Multi-track Web Audio player.
- `src/engine/audio/audio-export.ts`: Multi-track buffer mixing for video export.
- `src/export/video-encoder.ts`: Multi-track video export encoding integration.
- `src/editor/timeline/audio-track-control.tsx`: Multi-track timeline UI panel.
- Unit tests: `src/model/scene-audio.test.ts`, `src/engine/audio/audio-tracks.test.ts`, `src/engine/audio/audio-export.test.ts`.

## Sequencing

1. Model schema and normalization helpers (T001, T002).
2. Multi-track audio buffer mixing for export (T003, T004).
3. Web Audio player multi-track synchronization (T005, T008).
4. Video encoder and headless export integration (T006).
5. Timeline UI multi-track controls (T007).
