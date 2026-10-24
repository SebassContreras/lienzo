# 060 — voice-audio-and-font-validation — Tasks

- [ ] T001 [agent] [status:todo] Add pure `audioDuration` (MP3 frame walk with ID3v2 skip and resync, WAV RIFF) in `src/service/tts/audio-duration.ts`
      covers: D2@1
- [ ] T002 [agent] [status:todo] Use `audioDuration ?? durationSeconds ?? byte estimate` in `scene_generate_speech`
      covers: D2@1
- [ ] T003 [agent] [status:todo] Add `asTrack` to `attachSpeechToScene` (append a track via `getSceneAudioTracks` + `createAudioTrack`, keep `scene.audio`, append cues and drop the ones in the clip's window) and to the `scene_generate_speech` input
      covers: D1@1
- [ ] T004 [agent] [status:todo] Add compact `audioTracks` to `CompactSceneSchema` and `expandScene` (deterministic `track-<n>` ids), and regenerate `schemas/compact-scene.json`
      covers: D3@1
- [ ] T005 [agent] [status:todo] Add pure `keepAudio` in `src/service/compact/keep-audio.ts` and use it in `scene_build` on `overwrite`, with a notice
      covers: D4@1
- [ ] T006 [agent] [status:todo] Add pure `missingFonts` in `src/service/font-check.ts`, add font notices to `scene_build`, and add the `notices` output to `scene_validate`
      covers: D5@1, D6@1
- [ ] T007 [agent] [status:todo] Update the `scene_generate_speech`, `scene_build` and `scene_validate` tool descriptions
      covers: D7@1
- [ ] T008 [agent] [status:todo] Test audio duration (`src/service/tts/audio-duration.test.ts`, with frames built in the test):
      - 100 MPEG-1 Layer III frames at 44.1 kHz measure 100 × 1152 / 44100 s
      - MPEG-2 Layer III frames use 576 samples per frame
      - an ID3v2 tag before the first frame is skipped
      - a junk byte between frames is resynced past, and no frame is lost
      - regression (issue #11): a merged buffer whose Xing header claims half the frames reports the full length (fails with the byte estimate before T002)
      - a WAV with a 2 s `data` chunk measures 2 s
      - an unparseable buffer returns `undefined`, and the tool falls back to the estimate
      covers: R2@1
      kind: test
- [ ] T009 [agent] [status:todo] Test speech tracks (`src/service/tts/scene-audio.test.ts`):
      - regression (issue #10): two `asTrack` calls leave two voice tracks with their `startOffset`s (fails before T003)
      - with `asTrack`, an existing `scene.audio` is kept unchanged and appears once in the track list
      - without `asTrack`, `scene.audio` is replaced as before
      - with `asTrack`, cues are appended in `start` order, and a re-run for the same window replaces that window's cues
      covers: R1@1
      kind: test
- [ ] T010 [agent] [status:todo] Test audio in builds (`src/service/compact/keep-audio.test.ts`, `scene-build` tool test):
      - a compact `audioTracks` entry expands to a full track with id `track-1`
      - regression (issue #10): overwriting a scene that has `audioTracks` with a compact scene that has none keeps the tracks and adds a notice (fails before T005)
      - a compact `audioTracks: []` replaces the stored tracks
      covers: R3@1
      kind: test
- [ ] T011 [agent] [status:todo] Test font notices (`src/service/font-check.test.ts`, `scene-build` / `scene-validate` tool tests):
      - regression (issue #12): a text element in `Montserrat` with no such font installed yields one notice naming it (fails before T006)
      - a family installed in `projects/<slug>/fonts/` gives no notice
      - a subtitles element inside a group and an element inside a symbol are both checked
      - case differences (`inter`) and generic families (`serif`) give no notice
      - `scene_validate` stays `valid: true` with the notice
      covers: R4@1
      kind: test
