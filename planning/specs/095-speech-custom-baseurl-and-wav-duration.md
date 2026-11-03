# 095 — speech-custom-baseurl-and-wav-duration

## Goal
Fix two `scene_generate_speech` defects uncovered in the 2026-11-02 QA audit (`F-07`, `F-16`): (1) require `baseUrl` when `provider: "custom"` (`code: "invalid_input"`, `path: "baseUrl"`) instead of falling back to `http://localhost:8880/v1/audio/speech` (`tts_unavailable`), and (2) auto-detect WAV (`RIFF....WAVE`) audio buffers returned by local/custom TTS servers so `audioDuration` uses its WAV branch and saves `.wav` instead of forcing `.mp3` and miscalculating duration. Verification: `pnpm test`, `pnpm replay`, and `pnpm typecheck` pass.

## Context (Animator QA `V2-product`, 2026-11-02)
- **Origin classification against prior specs (`029`, `060`, `086` and `docs/qa-log.md:86`):**
  - **`F-07` (Known open bug from QA `2026-10-29` (`docs/qa-log.md:86`, `cf33234`, `planning/roadmap.md:74`), Class 3 — `src/service/speech/factory.ts:28-31`, `src/service/speech/tools/scene-generate-speech.ts:48-64,125-140`):**
    - Calling `scene_generate_speech` with `provider: "custom"` and no `baseUrl` passes `options.baseUrl = undefined` to `createTtsService` (`src/service/speech/factory.ts:28-31`), which falls back to `DEFAULT_LOCAL_TTS_URL` (`http://localhost:8880/v1/audio/speech`) and fails with connection errors at runtime instead of rejecting the missing `baseUrl` at input validation (`code: "invalid_input"`, `path: "baseUrl"`).
  - **`F-16` (Gap in `029`/`060`/`086/D3`, Class 2 — `src/service/speech/tools/scene-generate-speech.ts:145-185`, `src/service/speech/audio-duration.ts:88-105`):**
    - `src/service/speech/audio-duration.ts:88-105` implements WAV header duration parsing (`wavDuration` when `format === "wav"`).
    - However, neither the TTS adapters nor `scene_generate_speech` inspect the returned buffer bytes: `audioDuration` and `saveAudioAsset` rely on requested/adapter format strings without inspecting whether the returned audio bytes are actually RIFF WAV or MP3. When a local/custom TTS endpoint returns a PCM WAV buffer (`RIFF....WAVEfmt `) while format is set or treated as `"mp3"`, `mp3Duration` scans PCM samples for fake frame sync bytes, returning `2.33s` for a `4.00s` WAV clip (`qa/evidence/v2-speech-results.json`) and saving WAV bytes under a `.mp3` extension.

## Principles applied
| Principle | How it shows here |
|---|---|
| 1 KISS / YAGNI | 12-byte `RIFF`/`WAVE` header check and schema `superRefine` rule on `scene_generate_speech`. |
| 2 SRP | Format detection lives in `audio-duration.ts`; input validation lives in `scene-generate-speech.ts`; tasks separate test, implementation, docs, and verification. |
| 3 DRY via composition | `detectAudioFormat` is composed into `audioDuration` and `scene_generate_speech` rather than duplicating buffer header checks. |
| 4 ACL / DIP | `detectAudioFormat` inspects binary buffers at the service boundary so domain duration math and storage don't depend on unverified provider metadata. |
| 5 Stack standards | Spanish error message at `path: "baseUrl"` with `code: "invalid_input"`; pure `Uint8Array` buffer operations; Conventional Commits; replay corpus case in `qa-round-11.json`. |
| 6 Trade-offs | Documented pros, cons, and mitigations in Design. |
| TESTING.md | Parameterized table tests over provider inputs, buffer types, boundary limits, compound errors, and regression equivalence classes. |

## Requirements
- R1 (`F-07`): `scene_generate_speech` (`src/service/speech/tools/scene-generate-speech.ts:48-64`) requires a non-empty `baseUrl` when `provider === "custom"`.
  - Partitions:
    - `provider: "custom"` with `baseUrl` omitted (`undefined`) → fails with `code: "invalid_input"`, `path: "baseUrl"`, and Spanish message `"Indica baseUrl para el proveedor «custom»"`.
    - `provider: "custom"` with `baseUrl: ""` (empty string) → fails with `code: "invalid_input"`, `path: "baseUrl"`, and Spanish message `"Indica baseUrl para el proveedor «custom»"`.
    - `provider: "custom"` with `baseUrl: "   "` (whitespace only) → fails with `code: "invalid_input"`, `path: "baseUrl"`, and Spanish message `"Indica baseUrl para el proveedor «custom»"`.
    - `provider: "custom"` with valid `baseUrl: "http://127.0.0.1:18880"` → passes input validation and proceeds to contact the custom endpoint.
    - `provider: "local"` with `baseUrl` omitted → continues to default to `DEFAULT_LOCAL_TTS_URL` (`http://localhost:8880/v1/audio/speech`).
    - `provider: "kokoro"` with `baseUrl` omitted → continues to default to `DEFAULT_LOCAL_TTS_URL`.
    - `provider: "openrouter"` with `baseUrl` omitted → continues to default to `OPENROUTER_API_URL`.
    - `provider` omitted with `baseUrl` omitted → defaults to OpenRouter, unchanged.
  - Invariant: `provider: "custom"` without a non-empty `baseUrl` never attempts a network connection or scene mutation and fails immediately at input validation.
- R2 (`F-16`): `src/service/speech/audio-duration.ts:88-105` and `src/service/speech/tools/scene-generate-speech.ts:145-185` detect whether the synthesized `audioBuffer` starts with a WAV header (`"RIFF"` at bytes `0..4` and `"WAVE"` at bytes `8..12`), using `"wav"` for `audioDuration` and the saved asset extension (`.wav` vs `.mp3`).
  - Partitions:
    - Nominal WAV: Valid PCM WAV buffer (`RIFF....WAVE`, 4.00 s at 22050 Hz mono 16-bit) → `detectAudioFormat(buf)` returns `"wav"`, `audioDuration` returns `4.0`, file is saved as `<slug>.wav`.
    - Nominal MP3: Valid CBR/VBR MP3 buffer → `detectAudioFormat(buf)` returns `"mp3"`, `audioDuration` uses MP3 frame parsing, file is saved as `<slug>.mp3`.
    - Boundary / short buffer: Buffer shorter than 12 bytes (`0`, `4`, `11` bytes) → does not throw, falls back to `"mp3"`.
    - Boundary / non-WAVE RIFF: Buffer `>= 12` bytes starting with `RIFF` but bytes 8..12 are not `WAVE` (e.g. `RIFF....WEBP`) → returns `"mp3"`.
    - ID3 MP3 buffer: Buffer starting with ID3 header (`"ID3"`) → returns `"mp3"`.
    - Corrupt WAV data: Buffer starting with `RIFF....WAVE` but truncated before `data` chunk → `detectAudioFormat` returns `"wav"`, `audioDuration` safely returns `undefined` (falling back to byte-rate estimate).
  - Invariant: audio buffers starting with `"RIFF"` (bytes 0..4) and `"WAVE"` (bytes 8..12) are detected as `"wav"` and measured via `wavDuration`, while all others are treated as `"mp3"`.
- R3: Tool descriptions, agent usage skills, repository documentation, and QA log reflect the custom provider requirements and audio format behavior per AGENTS.md rules:
  - `README.md` and `src/service/speech/tools/scene-generate-speech.ts` document that `provider: "custom"` requires `baseUrl`.
  - `.agents/skills/lienzo-usage/SKILL.md` voice section notes custom provider requirements.
  - `docs/qa-log.md` status for `F-07` and `F-16` updated to `Closed` upon verification.

### Who it serves
All multi-shot voice-over workflows (`V2 product`) using `local` or `custom` TTS servers.

### Out of scope
- Adding new TTS providers or audio transcoding.

### Dependencies
- Can run independently of `089` (`speech-voiced-span`).

### Owner split
Agent tasks.

## Design
- D1 (R1): In `src/service/speech/tools/scene-generate-speech.ts:48-64`, add a `.superRefine` check on the input schema: when `val.provider === "custom" && !val.baseUrl?.trim()`, add an issue at `path: ["baseUrl"]` with message `"Indica baseUrl para el proveedor «custom»"`.
- D2 (R2): In `src/service/speech/audio-duration.ts:88-105`, export pure helper `detectAudioFormat(bytes: Uint8Array): "wav" | "mp3"` (`bytes.length >= 12 && ascii(bytes, 0) === "RIFF" && ascii(bytes, 8) === "WAVE" ? "wav" : "mp3"`). In `src/service/speech/tools/scene-generate-speech.ts:145-185`, resolve `const format = detectAudioFormat(speechResult.audioBuffer)` and pass it to both `audioDuration(speechResult.audioBuffer, format)` and `saveAudioAsset(..., speechResult.audioBuffer, format)`.
- D3 (R3): Update tool description in `src/service/speech/tools/scene-generate-speech.ts` and `README.md` to note `provider: "custom"` requiring `baseUrl`, verify `.agents/skills/lienzo-usage/SKILL.md`, and update `docs/qa-log.md` finding statuses for `F-07` and `F-16` to Closed upon verification.

### Trade-offs & Mitigations
- D1. Pros: immediate, deterministic `invalid_input` error at `path: "baseUrl"` before any async scene lookup or network calls. Cons: callers who used `provider: "custom"` expecting `localhost:8880` fallback must provide explicit `baseUrl` or use `provider: "local"`. Mitigation: `provider: "local"` is explicitly designed for the default `localhost:8880` endpoint.
- D2. Pros: zero-dependency 12-byte header inspection that reuses the existing `ascii` helper and activates `wavDuration` without modifying external network contracts. Cons: files can be `.wav` or `.mp3` depending on what the TTS server returns. Mitigation: `asset_add`, `scene.audio`, `audioTracks`, and `audio-export.ts` already fully support both `.wav` and `.mp3`.
- D3. Pros: keeps tool documentation, agent usage guides, and QA log findings status synchronized with code behavior per AGENTS.md. Cons: requires updating markdown documents alongside code. Mitigation: verified as part of the standard test and typecheck cycle.

## Tasks
- [x] 095/T001 [agent] Parameterized tests in `src/service/speech/tools/speech-tools.test.ts` (`test.each` tables with shape `[name, { provider, baseUrl }, { expectedOk, expectedCode, expectedPath }]` covering R1 partitions: custom missing baseUrl, custom empty string, custom whitespace, custom with valid baseUrl, local without baseUrl, and default provider), plus replay corpus case for `F-07` in `src/service/contract/corpus/qa-round-11.json` — covers R1
      verified: speech-tools.test.ts added parameterized table for custom baseUrl partitions and qa-round-11.json added F07 case (failing prior to implementation)
- [x] 095/T002 [agent] Parameterized tests in `src/service/speech/audio-duration.test.ts` and `src/service/speech/tools/speech-tools.test.ts` (`test.each` tables with shape `[name, { buffer, format }, { expectedFormat, expectedDuration, expectedExt }]` covering R2 partitions: nominal WAV buffer, nominal MP3 buffer, short buffers `< 12` bytes, non-WAVE RIFF headers, ID3 MP3 headers, and end-to-end `.wav` vs `.mp3` asset saving) — covers R2
      verified: parameterized tables in audio-duration.test.ts and speech-tools.test.ts added covering R2 partitions (failing prior to implementation)
- [x] 095/T003 [agent] Add `provider === "custom"` `baseUrl` validation in `src/service/speech/tools/scene-generate-speech.ts:48-64` (D1) — covers R1, D1
      verified: superRefine added to input schema, passing parameterized tests in speech-tools.test.ts and replay corpus case F07
- [x] 095/T004 [agent] Implement `detectAudioFormat(bytes: Uint8Array)` in `src/service/speech/audio-duration.ts:88-105` and wire detected format into `audioDuration` and `saveAudioAsset` in `src/service/speech/tools/scene-generate-speech.ts:145-185` (D2) — covers R2, D2
      verified: detectAudioFormat implemented and wired into scene_generate_speech, passing audio-duration.test.ts and speech-tools.test.ts
- [x] 095/T005 [agent] Docs: update `README.md`, tool description in `src/service/speech/tools/scene-generate-speech.ts`, and `.agents/skills/lienzo-usage/SKILL.md` for `provider: "custom"` and `baseUrl`; update `docs/qa-log.md` status for `F-07` and `F-16` to Closed upon verification (D3) — covers R3, D3
      verified: README.md, tool description, skill, and docs/qa-log.md updated and consistent
- [x] 095/T006 [agent] Verify: run `pnpm test`, `pnpm replay`, and `pnpm typecheck`, confirming all test suites and replay corpus cases pass; record `verified:` — covers R1–R3, D1–D3
      verified: pnpm typecheck (0 errors), pnpm replay (45/45 pass), pnpm test (230 test files, 2599 tests pass)

## Changes
- 2026-11-03: Audit corrections applied before task execution (F1–F6):
  - F1: Fixed test paths and task responsibilities (ENG-2). Replaced nonexistent test path `src/service/speech/tools/scene-generate-speech.test.ts` with actual test suite `src/service/speech/tools/speech-tools.test.ts`, and separated R1 input validation tests (T001) from R2 audio duration format tests (T002) with explicit parameterized test table shapes (`test.each`) and replay corpus target (`qa-round-11.json`).
  - F2: Corrected R1 partition providers. Replaced invalid enum values `"openai"` and `"elevenlabs"` with schema-supported providers (`"openrouter"`, `"kokoro"`).
  - F3: Corrected code line references and type definitions in Context, D1, and D2. Corrected schema lines `48-64` (was `71-79`), `factory.ts:28-31` (was `35-44`), `audio-duration.ts:88-105` (was `40-55`), and typed `detectAudioFormat` with `bytes: Uint8Array` matching domain types in `types.ts` rather than Node `Buffer`.
  - F4: Added Requirement R3, Design D3, and Task T005 covering documentation updates (`README.md`, tool description, `lienzo-usage` skill) and updating finding statuses (`F-07`, `F-16`) in `docs/qa-log.md` per AGENTS.md rules.
  - F5: Disentangled verification task T006 from documentation modifications, restricting it to verification command execution (`pnpm test`, `pnpm replay`, `pnpm typecheck`) and `verified:` recording (TEST-I1/I2, TRACE).
  - F6: Added Principles 3 (DRY via composition) and 4 (ACL/DIP) to Principles applied, explaining how `detectAudioFormat` is composed into `audioDuration` and `scene_generate_speech` across service boundaries.
