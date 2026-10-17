# 026 — audio-track — Design

## Approach

- D1@1 (implements R1): The scene model schema (`src/model/scene.ts`, `src/model/schema.ts`) adds an optional `audio` field: `assetId` (string), `volume` (number 0..1, default 1), `startOffset` (number >= 0, default 0), and `trimOffset` (number >= 0, default 0), validated with Zod.
- D2@1 (implements R2): Audio asset upload and retrieval reuses the existing content-hashed asset pipeline (`/api/assets`), supporting `.mp3`, `.wav`, `.aac`, `.ogg`, with MIME type validation in Vite middleware and CLI/service tools.
- D3@1 (implements R3): Audio playback in the editor is encapsulated behind an `AudioPlayer` interface (`src/engine/audio/audio-player.ts`) using the Web Audio API (`AudioContext`, `AudioBufferSourceNode`, `GainNode`); it synchronizes play, pause, seek, loop, and volume with canvas timeline time `t`.
- D4@2 (implements R4): Video export in `src/export/video-encoder.ts` uses Mediabunny's `AudioBufferSource` and `Output.addAudioTrack` to multiplex the scene audio track (with robust codec capability checking via `canEncodeAudio`, selecting AAC or PCM/Opus fallback), accurately matching scene duration, `startOffset`, and `trimOffset`.
- D5@1 (implements R5): Headless rendering in `src/export/render-page.ts` and `scene_export` passes audio asset data through the render context, ensuring Playwright headless Chromium renders video with the multiplexed audio track intact.
- D6@1 (implements R6): An audio control in the editor footer (`src/editor/footer/editor-footer.tsx`) provides UI controls to attach/upload an audio file, adjust volume and start offset, mute/unmute, and remove the audio track.

## Trade-offs & Mitigations

- **Decision:** Web Audio `AudioBuffer` decoding over `<audio>` HTML elements.
  - *Pros:* Sample-accurate synchronization during scrubbing/looping; direct compatibility with Mediabunny's `AudioBufferSource`.
  - *Cons:* Audio files are loaded entirely into RAM.
  - *Mitigation:* Social media post audio is short (typically 3s–60s), consuming only a few megabytes of memory.
- **Decision:** Pure timing calculation helper (`src/engine/audio/audio-timing.ts`).
  - *Pros:* High cohesion, deterministic unit testing of start/trim offsets and loop boundaries without needing a browser or Web Audio runtime.
  - *Cons:* Extra small module.
  - *Mitigation:* Adheres strictly to SRP and KISS; trivial to maintain and test.

## Deliverables

- `src/model/scene.ts`, `src/model/schema.ts`: `SceneAudio` schema and types.
- `src/engine/audio/audio-timing.ts`: Pure audio slice and offset timing calculation helper.
- `src/engine/audio/audio-player.ts`: Web Audio API playback adapter.
- `src/export/video-encoder.ts`: Audio track multiplexing via Mediabunny `AudioBufferSource`.
- `src/editor/footer/editor-footer.tsx`: Audio track UI controls in editor footer.
- Unit tests: `src/engine/audio/audio-timing.test.ts`, `src/model/scene-audio.test.ts`.

## Sequencing

1. Schema & pure timing calculations (T001, T002).
2. Audio player adapter & editor timeline sync (T003, T004).
3. Video encoder audio multiplexing & headless export (T005, T006).
4. Audio track UI controls & tests (T007, T008).
