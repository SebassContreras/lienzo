# 089 — speech-voiced-span

## Goal
`scene_generate_speech` says where the voice really starts and ends inside its clip, and can skip
the clip's leading silence, so an agent can place one clip per shot without guessing. Verification:
a Kokoro clip returns `speechStart` ≈ 0.4 s and `speechEnd` ≈ `audioDuration` − 0.6 s (measured
below); with `trimSilence: true` the new audio track's `trimOffset` equals `speechStart`; `pnpm test`
and `pnpm typecheck` pass.

## Context (Animator video `ringana-skin-perfection`, 2026-10-31)
- Six Kokoro clips (voice `af_bella`) of 4–7 words each lasted 2.2–4.2 s. `ffmpeg silencedetect`
  (−40 dB, 0.1 s) on two of them: 0.40 s and 0.43 s of silence at the start, 0.61 s and 0.57 s at
  the end. About 1 s of every clip is silence.
- The tool returns only `audioDuration`, measured from the frames (`audio-duration.ts`). Placing
  clips by `audioDuration` made them overlap in a 20 s scene, and two lines were shortened.
- Audio tracks already have `trimOffset` (`src/engine/audio/audio-export.ts`), which skips the
  start of a clip; nothing sets it.
- Subtitle cues are spread over the clip by text length (`speech-alignment.ts`), not from the
  audio, so they include the silence too.

## Principles applied
| Principle | How it shows here |
|---|---|
| 1 KISS / YAGNI | Measure and report start/end; trim only the start through existing `trimOffset`; no audio re-encoding. |
| 2 SRP | Pure `voicedSpan` calculates boundaries from PCM samples; WAV parser extracts samples; tool only wires output and writes `trimOffset`. |
| 3 DRY by composition | Reuses existing `audioDuration` WAV parsing, `SceneAudio` / `AudioTrackItem` pipeline, and `round2` helper. |
| 5 Stack standards | Spanish error messages and notices, `snake_case` codes, docs travel with behavior. |
| 6 Document Trade-offs | Documented pros, cons, and mitigations in Design. |
| 7 Validate with Research | Cites OpenAI-compatible audio API specification for `response_format: "wav"`. |
| TESTING.md | Parameterized table tests over R1 partitions and boundaries; timing and golden render invariants. |

## Requirements
- R1: `scene_generate_speech` returns `speechStart` and `speechEnd` (seconds from the clip's
  start, rounded to hundredths via `round2`): the first and last instant the signal is above a
  silence threshold of −40 dBFS, for every provider whose audio provides PCM samples (WAV).
  Partitions:
  - speech from the first sample (`speechStart: 0`);
  - leading and trailing silence (0 < `speechStart` < `speechEnd` < `audioDuration`);
  - speech ending at the final sample (`speechEnd == audioDuration`);
  - pauses inside speech (RMS dips below threshold inside speech do not split the span);
  - all-silent clip (both `speechStart` and `speechEnd` are `null`, with a notice);
  - audio format without PCM decoding (e.g. MP3 fallback: both `null`, with a notice);
  - empty or malformed audio buffer (both `null`, with a notice).
  Invariant: when both numbers are present, 0 ≤ `speechStart` < `speechEnd` ≤ `audioDuration`.
  Output schema: `speechStart: z.number().nullable()`, `speechEnd: z.number().nullable()`.
- R2: With `trimSilence: true` (default `false`), the written track (`audioTracks` entry when
  `asTrack: true`, or `scene.audio` when `asTrack: false`) gets `trimOffset` = `speechStart`
  (minus a 0.05 s margin, at least 0, rounded to hundredths), and subtitle cues start at `startOffset`
  with duration matching the audible portion (`totalDuration = Math.max(0.1, round2(estimatedDuration - effectiveTrimOffset))`).
  Partitions:
  - `trimSilence: false` or omitted: `trimOffset` is unset/0, cues span `estimatedDuration` (unchanged);
  - `trimSilence: true` with valid `speechStart`: `trimOffset = Math.max(0, round2(speechStart - 0.05))`, cues shifted;
  - `trimSilence: true` when `speechStart` is `null` (all-silent or non-PCM): `trimOffset` is unset/0, cues span `estimatedDuration`, notice emitted;
  - `asTrack: true` writes `trimOffset` on the appended `audioTracks` item;
  - `asTrack: false` writes `trimOffset` on `scene.audio`.
  Invariant: `trimOffset` is never negative and never exceeds `audioDuration`.
- R3: The tool description, README and `lienzo-usage` explain `speechStart`, `speechEnd`, and
  the `trimSilence` option, and document that the clip still ends with its trailing silence
  (harmless when subsequent clips start at their scheduled `startOffset`).

### Who it serves
Agents writing one voice clip per shot (Animator's `lienzo-animate` step 3).

### Out of scope
- Cutting trailing silence (tracks have no end trim) and re-encoding audio files.
- Word-level alignment.

### Dependencies
- None.

### Owner split
Agent tasks.

## Design
- D1 (R1): Synthesize audio requesting `response_format: "wav"` from local/Kokoro/OpenRouter TTS
  services (supported by OpenAI-compatible audio API). Standard 16-bit PCM RIFF/WAVE bytes are
  received in a single request. `readWavSamples(audioBuffer)` extracts the 16-bit PCM samples
  (`Int16Array`) and sample rate from the `"fmt "` and `"data"` chunks. If the provider returns
  non-WAV bytes (e.g. MP3), `speechStart` and `speechEnd` return `null` with a Spanish notice.
  Source: https://platform.openai.com/docs/api-reference/audio/createSpeech (accessed 2026-11-02).
- D2 (R1): Pure function `voicedSpan(samples, sampleRate, thresholdDbfs = -40, windowMs = 10)` in
  `src/service/speech/voiced-span.ts`: evaluates non-overlapping or sliding 10 ms windows
  (`Math.floor(sampleRate * 0.010)` samples); computes RMS in dBFS (`20 * Math.log10(rms / 32767)`);
  identifies the start time of the first window and end time of the last window where RMS ≥ `thresholdDbfs`.
  Returns `{ start: number; end: number } | null`.
- D3 (R2): `trimOffset` is written to `audioTracks` when `asTrack: true` or `scene.audio` when
  `asTrack: false`, using `Math.max(0, round2(speechStart - 0.05))`. Both schemas already declare
  `trimOffset: z.number().min(0).optional()` (`src/model/schema.ts:36,45`). When `trimSilence: true`
  and `speechStart` is present, `alignScriptToCues` is called with duration adjusted by `trimOffset`
  so subtitle cues start at `startOffset` and match audible speech.

### Trade-offs & Mitigations
- D1. Pros: zero external decoder dependencies; uncompressed PCM samples read directly in memory; single HTTP call.
  Cons: WAV files are larger than MP3 in local disk storage (~10x for raw PCM).
  Mitigation: clips are short per-shot phrases (2–5 s, ~100–300 KB); local storage in `projects/<project>/assets/` handles this easily. Non-WAV formats fail gracefully to `null` with a notice.
- D2. Pros: 10 ms RMS window at −40 dBFS matches standard audio processing (`ffmpeg silencedetect`).
  Cons: continuous background noise above −40 dBFS could prevent silence detection.
  Mitigation: synthetic TTS speech produces digital silence (< −60 dBFS); −40 dBFS is established by measured Kokoro audio context.
- D3. Pros: reuses existing `trimOffset` pipeline already implemented across schema, export, player, and timing math.
  Cons: leaves trailing silence on disk.
  Mitigation: subsequent clips start at their scheduled `startOffset`, so trailing silence does not cause audible overlap.

## Tasks
- [x] 089/T001 [agent] Tests, written first, in `src/service/speech/voiced-span.test.ts`: `test.each` table over R1 partitions (speech at start, leading/trailing silence, pause inside speech, all-silent, empty samples, sample rate 24kHz and 44.1kHz) asserting `{ start, end }` or `null`, and invariant `0 <= start < end <= duration` — covers R1, D2
  verified: 2026-11-02, unit test suite with 7 table-driven tests passed covering R1 partitions, boundaries, and dBFS thresholds.
- [x] 089/T002 [agent] Tests, written first, in `src/service/speech/tools/speech-tools.test.ts`: `test.each` table over tool outputs (WAV clip with silence returning `speechStart`/`speechEnd`, `trimSilence: true` writing `trimOffset` and adjusting cues, `trimSilence: false` preserving 0/unset, `asTrack: true` vs `scene.audio`, all-silent WAV emitting notice, non-WAV buffer emitting notice) — covers R1, R2, D1, D3
  verified: 2026-11-02, contract tests covering all tool output partitions, trimOffset calculations, cues shifting, and notice emission pass.
- [x] 089/T003 [agent] Pure `voicedSpan` function in `src/service/speech/voiced-span.ts` and `readWavSamples` helper in `src/service/speech/audio-duration.ts` (or `wav-samples.ts`) — covers R1, D1, D2
  verified: 2026-11-02, pure voicedSpan and readWavSamples implemented with 10 ms window RMS math and RIFF/WAVE parsing; unit tests in voiced-span.test.ts and wav-samples.test.ts pass.
- [x] 089/T004 [agent] Wire WAV request format and `speechStart`/`speechEnd` into `scene_generate_speech` output; wire `trimSilence` option and cue adjustment into `attachSpeechToScene` (D1, D3) — covers R1, R2, D1, D3
  verified: 2026-11-02, scene-generate-speech requests format: 'wav', parses PCM samples, sets speechStart/speechEnd, applies trimSilence to trimOffset and subtitles cues in scene-audio.ts; pnpm test src/service/speech/ passes 80 tests.
- [x] 089/T005 [agent] Docs: update `scene_generate_speech` tool description, `README.md`, and `.agents/skills/lienzo-usage/SKILL.md` (R3) — covers R3
  verified: 2026-11-02, documented speechStart, speechEnd, trimSilence option and trailing silence behavior; descriptions.test.ts passed.
- [x] 089/T006 [agent] Verify: call `scene_generate_speech` (CLI or integration test with synthetic WAV fixture matching Goal's 0.4s leading and 0.6s trailing silence); verify `speechStart ≈ 0.4`, `speechEnd ≈ audioDuration - 0.6`, `trimOffset` set, cues shifted; run `pnpm test` and `pnpm typecheck`; record `verified:` — covers R1, R2
  verified: 2026-11-02, verified with synthetic WAV fixture (0.4s leading, 0.6s trailing) that speechStart=0.4, speechEnd=1.4, trimOffset=0.35, cues shifted; full test suite (2525 tests), pnpm typecheck, and pnpm build:cli pass cleanly.

## Changes
- 2026-11-02: Audit corrections applied before task execution (F1–F9):
  - F1: Replaced retired 10-principle references (`5 Pure functions`, `9 Research`) with the 7 Core Engineering Principles from `ENGINEERING.md` and `TESTING.md`.
  - F2: Removed speculative "assumed" threshold from R1; specified exact −40 dBFS threshold, comprehensive input partitions (all-silent, non-PCM, boundaries), and `round2` hundredths invariant.
  - F3: Specified concrete behavior and partitions for `trimSilence` in R2 (`trimOffset` margin calculation, subtitle cue length adjustment, all-silent fallback notice, `asTrack` vs `scene.audio`).
  - F4: Replaced speculative "(assumed)" two-request model in D1 with single-request `response_format: "wav"` architecture; added official OpenAI audio API specification citation (ENG-7).
  - F5: Specified exact mathematical formulation for `voicedSpan` in D2 (10 ms window RMS in dBFS relative to 16-bit full scale).
  - F6: Replaced speculative "if that field supports it (T001 checks)" in D3 with concrete schema confirmation of `trimOffset` across `scene.audio` and `audioTracks`.
  - F7: Renamed section to `### Trade-offs & Mitigations` and expanded pros, cons, and mitigations for D1, D2, and D3.
  - F8: Replaced discovery task T001 with test-first tasks (T001 unit, T002 integration), decomposed compound tasks, and added Goal verification task T006.
  - F9: Added `## Changes` entry documenting audit findings.
