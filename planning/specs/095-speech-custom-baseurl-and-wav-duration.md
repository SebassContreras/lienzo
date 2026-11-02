# 095 — speech-custom-baseurl-and-wav-duration

## Goal
Fix two `scene_generate_speech` defects uncovered in the 2026-11-02 QA audit (`F-07`, `F-16`): (1) require `baseUrl` when `provider: "custom"` (`code: "invalid_input"`, `path: "baseUrl"`) instead of falling back to `http://localhost:8880/v1/audio/speech` (`tts_unavailable`), and (2) auto-detect WAV (`RIFF....WAVE`) audio buffers returned by local/custom TTS servers so `audioDuration` uses its WAV branch and saves `.wav` instead of forcing `.mp3` and miscalculating duration. Verification: `pnpm test`, `pnpm replay`, and `pnpm typecheck` pass.

## Context (Animator QA `V2-product`, 2026-11-02)
- **Origin classification against prior specs (`029`, `060`, `086` and `docs/qa-log.md:86`):**
  - **`F-07` (Known open bug from QA `2026-10-29` (`docs/qa-log.md:86`, `cf33234`, `planning/roadmap.md:70`), Class 3 — `src/service/speech/factory.ts:35-44`, `src/service/speech/tools/scene-generate-speech.ts:71-79,127-139`):**
    - Calling `scene_generate_speech` with `provider: "custom"` and no `baseUrl` passes `options.baseUrl = undefined` to `createTtsService` (`src/service/speech/factory.ts:35-44`), which falls back to `DEFAULT_LOCAL_TTS_URL` (`http://localhost:8880/v1/audio/speech`) and fails with `code: "tts_unavailable", path: "provider"` instead of rejecting the missing `baseUrl` at input validation (`qa/evidence/v2-speech-errors.json`).
  - **`F-16` (Gap in `029`/`060`/`086/D3`, Class 2 — `src/service/speech/tools/scene-generate-speech.ts:115,142`, `src/service/speech/audio-duration.ts:40-55`):**
    - `src/service/speech/audio-duration.ts:40-55` already implements WAV header duration parsing (`wavDuration` when `format === "wav"`).
    - However, `src/service/speech/tools/scene-generate-speech.ts:115,142` hardcodes `"mp3"` in `audioDuration(audioBuffer, "mp3")` and `saveAudioAsset(..., "mp3")` (`086/D3`). When a local/custom TTS endpoint returns a PCM WAV buffer (`RIFF....WAVEfmt `), `mp3Duration` scans PCM samples for fake `0xFFE0` MP3 frame sync bytes (or falls back to `bytes / 16000`), returning `2.33s` for a `4.00s` WAV clip (`qa/evidence/v2-speech-results.json`) and saving WAV bytes under a `.mp3` extension.

## Principles applied
| Principle | How it shows here |
|---|---|
| 1 KISS / YAGNI | 4-byte `RIFF`/`WAVE` magic-byte check and one `superRefine` rule on `scene_generate_speech`. |
| 2 SRP | Format detection lives in `audio-duration.ts`; input validation lives in `scene-generate-speech.ts`. |
| 5 Stack standards | Spanish error message at `path: "baseUrl"` with `code: "invalid_input"`. |
| 6 Trade-offs | Documented pros, cons, and mitigations in Design. |
| TESTING.md | Parameterized table tests over provider inputs and WAV/MP3 buffers. |

## Requirements
- R1 (`F-07`): `scene_generate_speech` (`src/service/speech/tools/scene-generate-speech.ts:71-79`) requires a non-empty `baseUrl` when `provider === "custom"`.
  - Partitions:
    - `provider: "custom"` with `baseUrl` omitted or `""` → fails with `code: "invalid_input"`, `path: "baseUrl"`, and Spanish message `"Indica baseUrl para el proveedor «custom»"`.
    - `provider: "custom"` with valid `baseUrl: "http://127.0.0.1:18880"` → proceeds to call the custom endpoint.
    - `provider: "local"` with `baseUrl` omitted → continues to default to `DEFAULT_LOCAL_TTS_URL` (`http://localhost:8880/v1/audio/speech`).
    - `provider: "openai"` or `"elevenlabs"` with `baseUrl` omitted → unchanged.
  - Invariant: `provider: "custom"` without `baseUrl` never attempts a network connection to `localhost:8880`.
- R2 (`F-16`): `src/service/speech/audio-duration.ts:40-55` and `src/service/speech/tools/scene-generate-speech.ts:115,142` detect whether the synthesized `audioBuffer` starts with a WAV header (`"RIFF"` at bytes `0..4` and `"WAVE"` at bytes `8..12`), using `"wav"` for both `audioDuration` and the saved asset extension (`.wav` vs `.mp3`).
  - Partitions:
    - Valid PCM WAV buffer (`RIFF....WAVE`, 4.00 s at 22050 Hz mono 16-bit) → `audioFormat(buf)` returns `"wav"`, `audioDuration` returns `4.0`, file is saved as `<slug>.wav`.
    - Valid CBR/VBR MP3 buffer → `audioFormat(buf)` returns `"mp3"`, `audioDuration` uses MP3 frame parsing, file is saved as `<slug>.mp3`.
    - Buffer shorter than 12 bytes → falls back to `"mp3"`.
  - Invariant: WAV buffers returned by `local` or `custom` TTS servers report their exact header duration (`dataSize / byteRate`) and are stored with `.wav` extension.

### Who it serves
All multi-shot voice-over workflows (`V2 product`) using `local` or `custom` TTS servers.

### Out of scope
- Adding new TTS providers or audio transcoding.

### Dependencies
- Can run independently of `089` (`speech-voiced-span`).

### Owner split
Agent tasks.

## Design
- D1 (R1): In `src/service/speech/tools/scene-generate-speech.ts:71-79`, add a `.superRefine` check on the input schema: when `val.provider === "custom" && !val.baseUrl?.trim()`, add an issue at `path: ["baseUrl"]` with message `"Indica baseUrl para el proveedor «custom»"`.
- D2 (R2): In `src/service/speech/audio-duration.ts:40-55`, export `detectAudioFormat(buf: Buffer): "wav" | "mp3"` (`buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WAVE" ? "wav" : "mp3"`), and use `const ext = detectAudioFormat(audioBuffer)` in `src/service/speech/tools/scene-generate-speech.ts:115,142` for both `audioDuration(audioBuffer, ext)` and the output filename.

### Trade-offs & Mitigations
- D1. Pros: immediate, deterministic `invalid_input` error at `path: "baseUrl"` without probing `localhost:8880`. Cons: callers who used `provider: "custom"` expecting `localhost:8880` must use `provider: "local"` instead. Mitigation: `provider: "local"` is explicitly designed for `localhost:8880`.
- D2. Pros: zero-dependency 12-byte header inspection that activates the existing `wavDuration` implementation in `audio-duration.ts:44-50`. Cons: files can be `.wav` or `.mp3` depending on what the TTS server returns. Mitigation: `asset_add`, `scene.audio`, `audioTracks`, and `audio-export.ts` already support both `.wav` and `.mp3`.

## Tasks
- [ ] 095/T001 [agent] Write failing tests in `src/service/speech/audio-duration.test.ts` and `src/service/speech/tools/scene-generate-speech.test.ts` (`test.each` tables covering R1 and R2 partitions), plus replay corpus case for `F-07` — covers R1, R2
- [ ] 095/T002 [agent] Add `provider === "custom"` `baseUrl` validation in `src/service/speech/tools/scene-generate-speech.ts:71-79` (D1) — covers R1, D1
- [ ] 095/T003 [agent] Implement `detectAudioFormat(buf)` in `src/service/speech/audio-duration.ts:40-55` and wire it into `src/service/speech/tools/scene-generate-speech.ts:115,142` (D2) — covers R2, D2
- [ ] 095/T004 [agent] Verify: run `pnpm test`, `pnpm replay`, and `pnpm typecheck`, update `docs/qa-log.md` status for `F-07` and `F-16`, and record `verified:` — covers R1, R2, D1, D2
