# 060 — voice-audio-and-font-validation — Tasks

- [x] T001 [agent] [status:done] Add pure `audioDuration` (MP3 frame walk with ID3v2 skip and resync, WAV RIFF) in `src/service/tts/audio-duration.ts`
      covers: D2@1
      changes: src/service/tts/audio-duration.ts (+104 -0)
- [x] T002 [agent] [status:done] Use `audioDuration ?? durationSeconds ?? byte estimate` in `scene_generate_speech`
      covers: D2@1
      changes: src/service/tools/scene-generate-speech.ts (+6 -5)
- [x] T003 [agent] [status:done] Add `asTrack` to `attachSpeechToScene` (append a track via `getSceneAudioTracks` + `createAudioTrack`, keep `scene.audio`, append cues and drop the ones in the clip's window) and to the `scene_generate_speech` input
      covers: D1@1
      changes: src/service/tools/scene-generate-speech.ts (+2 -0), src/service/tts/scene-audio.ts (+43 -7)
- [x] T004 [agent] [status:done] Add compact `audioTracks` to `CompactSceneSchema` and `expandScene` (deterministic `track-<n>` ids), and regenerate `schemas/compact-scene.json`
      covers: D3@1
      changes: schemas/compact-scene.json (+37 -0), src/model/compact.ts (+13 -0), src/service/compact/expand.ts (+7 -0)
- [x] T005 [agent] [status:done] Add pure `keepAudio` in `src/service/compact/keep-audio.ts` and use it in `scene_build` on `overwrite`, with a notice
      covers: D4@1
      changes: src/service/compact/keep-audio.ts (+24 -0), src/service/tools/scene-build.ts (+12 -5)
- [x] T006 [agent] [status:done] Add pure `missingFonts` in `src/service/font-check.ts`, add font notices to `scene_build`, and add the `notices` output to `scene_validate`
      covers: D5@1, D6@1
      changes: src/service/font-check.ts (+52 -0), src/service/tools/scene-build.ts (+10 -0), src/service/tools/scene-generate-speech.ts (+1 -1), src/service/tools/scene-validate.ts (+18 -3), src/service/tts/audio-duration.ts (+2 -1)
- [x] T007 [agent] [status:done] Update the `scene_generate_speech`, `scene_build` and `scene_validate` tool descriptions
      covers: D7@1
      changes: src/service/tools/scene-build.ts (+4 -1), src/service/tools/scene-generate-speech.ts (+5 -1)
- [x] T008 [agent] [status:done] Test audio duration (`src/service/tts/audio-duration.test.ts`, with frames built in the test):
      - 100 MPEG-1 Layer III frames at 44.1 kHz measure 100 × 1152 / 44100 s
      - MPEG-2 Layer III frames use 576 samples per frame
      - an ID3v2 tag before the first frame is skipped
      - a junk byte between frames is resynced past, and no frame is lost
      - regression (issue #11): a merged buffer whose Xing header claims half the frames reports the full length (fails with the byte estimate before T002)
      - a WAV with a 2 s `data` chunk measures 2 s
      - an unparseable buffer returns `undefined`, and the tool falls back to the estimate
      covers: R2@1
      kind: test
      changes: src/service/tts/audio-duration.test.ts (+142 -0)
- [x] T009 [agent] [status:done] Test speech tracks (`src/service/tts/scene-audio.test.ts`):
      - regression (issue #10): two `asTrack` calls leave two voice tracks with their `startOffset`s (fails before T003)
      - with `asTrack`, an existing `scene.audio` is kept unchanged and appears once in the track list
      - without `asTrack`, `scene.audio` is replaced as before
      - with `asTrack`, cues are appended in `start` order, and a re-run for the same window replaces that window's cues
      covers: R1@1
      kind: test
      changes: src/service/tts/scene-audio.test.ts (+109 -0)
- [x] T010 [agent] [status:done] Test audio in builds (`src/service/compact/keep-audio.test.ts`, `scene-build` tool test):
      - a compact `audioTracks` entry expands to a full track with id `track-1`
      - regression (issue #10): overwriting a scene that has `audioTracks` with a compact scene that has none keeps the tracks and adds a notice (fails before T005)
      - a compact `audioTracks: []` replaces the stored tracks
      covers: R3@1
      kind: test
      changes: src/service/compact/keep-audio.test.ts (+44 -0), src/service/service.test.ts (+58 -0)
- [x] T011 [agent] [status:done] Test font notices (`src/service/font-check.test.ts`, `scene-build` / `scene-validate` tool tests):
      - regression (issue #12): a text element in `Montserrat` with no such font installed yields one notice naming it (fails before T006)
      - a family installed in `projects/<slug>/fonts/` gives no notice
      - a subtitles element inside a group and an element inside a symbol are both checked
      - case differences (`inter`) and generic families (`serif`) give no notice
      - `scene_validate` stays `valid: true` with the notice
      covers: R4@1
      kind: test
      changes: src/service/font-check.test.ts (+53 -0)
