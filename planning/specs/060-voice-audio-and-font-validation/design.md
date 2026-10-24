# 060 — voice-audio-and-font-validation — Design

## Approach

- D1@1 (implements R1): `scene_generate_speech` gets `asTrack: z.boolean().default(false)`, which is passed to `attachSpeechToScene` (`src/service/tts/scene-audio.ts`) as a new `asTrack` option. With `asTrack: false`, nothing changes: `scene.audio` is replaced. With `asTrack: true`, the function leaves `scene.audio` as it is and sets `audioTracks` to `[...getSceneAudioTracks(scene), track]`. `track` comes from `createAudioTrack(assetId, { name: "Voz", volume, startOffset })` (`src/engine/audio/audio-tracks.ts`), the factory the editor already uses. `getSceneAudioTracks` is reused on purpose. Playback ignores `scene.audio` once `audioTracks` isn't empty, so the first appended clip has to carry a legacy `scene.audio` into the list as its own track. Otherwise the music would go silent. With `asTrack: true`, cues are **appended** to the existing `subtitles` element's cues, sorted by `start`, instead of replacing them. One clip per shot then builds one subtitle track. Without `asTrack`, cues are replaced as they are today.
- D2@1 (implements R2): New pure module `src/service/tts/audio-duration.ts` exports `audioDuration(bytes: Uint8Array, format: string): number | undefined`.
  - **MP3**: skip an ID3v2 tag (10-byte header, syncsafe size), then walk the MPEG audio frames. For each 4-byte header (sync `0xFFE`), read the version (1 / 2 / 2.5), layer, bitrate index, sample-rate index and padding. Then add `samplesPerFrame / sampleRate` (1152 for MPEG-1 Layer III, 576 for MPEG-2/2.5 Layer III, 384 for Layer I, 1152 for Layer II), and jump `frameLength` bytes ahead (`144·bitrate/sr + pad` for MPEG-1 L3, `72·bitrate/sr + pad` for MPEG-2/2.5 L3, `(12·bitrate/sr + pad)·4` for Layer I). The walk resyncs byte by byte past junk and stops at the end of the buffer or at a header that doesn't fit. A Xing/Info/VBRI frame count is **not** trusted. Issue #11's clip was merged, and a header written for the first part reports only that part's length. That fits the reported 1.5 s against the 2.7 s that was heard. Walking the frames counts what actually plays.
  - **WAV**: walk the RIFF chunks and return `dataChunkSize / byteRate` from the `fmt ` chunk.
  - Any other format, or a buffer with no valid frame, returns `undefined`.

  The tool uses `audioDuration(...) ?? speechResult.durationSeconds ?? byteEstimate`. The current 16 000 B/s estimate stays as the last fallback, so formats that can't be parsed (aac, opus) still work.
- D3@1 (implements R3): `CompactSceneSchema` (`src/model/compact.ts`) gets `audioTracks: z.array(CompactAudioTrackSchema).optional()`. `CompactAudioTrackSchema` is `assetId` plus the optional `id`, `name`, `volume`, `startOffset`, `trimOffset` and `muted`. `expandScene` maps each entry to a full `AudioTrackItem`, with `id` defaulting to `track-<i+1>` so a build is deterministic. `schemas/compact-scene.json` is regenerated.
- D4@1 (implements R3): `scene_build` with `save` + `overwrite` reads the existing scene before saving. If the compact input has no `audioTracks` key, it carries over the stored `audioTracks` and `audio` and adds a notice: "Se conservaron N pistas de audio de la escena existente". If the compact input has `audioTracks` (`[]` included), those win. That's the "explicitly overwritten" case. The carry-over is a pure function `keepAudio(built, previous, compact): { scene; notice? }` in `src/service/compact/keep-audio.ts`, so the tool only reads and saves.
- D5@1 (implements R4): New pure function `missingFonts(scene: Scene, installed: readonly string[]): string[]` in `src/service/font-check.ts`. It walks `elements`, group `children` and `symbols.*.children`. For `text` and `subtitles` elements it collects `el.font`, and it returns, in first-seen order, the families that aren't in `installed`. Matching ignores case, as CSS family matching does, and CSS generic families (`serif`, `sans-serif`, `monospace`, `system-ui`, `cursive`, `fantasy`) never count as missing. `installed` is the families from `availableFonts(ctx.fonts, project)` (bundled + global `fonts/` + `projects/<slug>/fonts/`, as `font_list` lists them), so the check uses the same source as `font_list`.
- D6@1 (implements R4): Both tools add one notice per missing family: «La fuente «Montserrat» no está instalada; se dibujará con otra. Usa font_install». `scene_build` appends it to its existing `notices`. `scene_validate` gets an output of `Verdict.extend({ notices: z.array(z.string()).optional() })`, and the font check runs only when the scene is valid. A missing font is a warning, not a failure: `valid` stays `true`, because the scene opens and draws. `Verdict` itself isn't changed, so `preset_validate` keeps its shape.
- D7@1 (implements R1, R3, R4): Tool descriptions: `scene_generate_speech` explains `asTrack` (one clip per shot, with cues appended). `scene_build` mentions `audioTracks`, the overwrite carry-over and the font notices. `scene_validate` mentions the font notices.

## Trade-offs & Mitigations

### 1. Our own MP3/WAV duration parser vs. `music-metadata`
- **Pro**: It's about 80 lines of pure code with no new dependency. It runs the same in Node and the browser and is easy to test with frames built in the test. `music-metadata` may stop at the Xing header unless `duration: true` makes it parse the whole file, and that header is exactly what goes wrong for merged clips.
- **Con**: We own the bitrate/sample-rate tables and edge cases such as free-format bitrate and a truncated last frame.
- **Mitigation**: The tables are fixed by ISO 11172-3 / 13818-3. Free-format bitrate (index 0) and bad headers end the walk, and the fallback chain still returns a duration. Tests cover MPEG-1 and MPEG-2 frames, an ID3v2 prefix, a junk byte before a frame, a merged buffer with a wrong Xing count, and WAV. YAGNI: we don't adopt the library until a format we can't parse (aac/opus) is actually requested.

### 2. Walking every frame vs. trusting the Xing/VBRI frame count
- **Pro**: It's correct for CBR, VBR and concatenated clips alike, which is the case behind issue #11.
- **Con**: It's O(file size), and in theory slower than reading one header.
- **Mitigation**: TTS clips are a few hundred KB, so the walk takes microseconds next to a network synthesis call. The LAME Info frame is counted as one silent frame (≈26 ms), well within the 0.1 s rounding the tool already uses.

### 3. `asTrack` copies a legacy `scene.audio` into the track list
- **Pro**: Music set through `scene.audio` keeps playing, because playback reads `audioTracks` first. That's R1's "preserving `scene.audio`".
- **Con**: After the first append, the same asset appears both in `scene.audio` and as `legacy-track`.
- **Mitigation**: Playback ignores `scene.audio` once tracks exist, so nothing plays twice. `scene.audio` is kept unchanged so older readers still see it, and a test pins that only one playable copy results.

### 4. Appending cues with `asTrack` vs. one subtitles element per clip
- **Pro**: One subtitle track for the whole voice-over, ordered by time, with no layout work.
- **Con**: Regenerating the same clip adds its cues a second time.
- **Mitigation**: Before appending, cues already inside the new clip's `[startOffset, startOffset + duration)` window are dropped. A re-run then replaces that shot's subtitles instead of duplicating them.

### 5. Carrying audio over on `overwrite` vs. always replacing
- **Pro**: It fixes issue #10's lost tracks without any extra input. Audio is usually generated after the visuals, so a redesign shouldn't erase it.
- **Con**: `overwrite` no longer means "exactly what the compact says" for audio.
- **Mitigation**: An explicit `audioTracks` (even `[]`) still replaces, and the carry-over is reported as a notice, so it never happens silently.

### 6. Font notices as warnings vs. validation failures
- **Pro**: The scene is valid and renders. Blocking would stop work on a scene whose font is about to be installed.
- **Con**: A notice can be missed, which is how issue #12 happened.
- **Mitigation**: The notice names the family and the fix (`font_install`), and it shows up in both the build and the validate output, the two places an agent looks.

### 7. Checking only `text` and `subtitles` vs. every font field
- **Pro**: It's R4's exact scope, and those are the elements that render running text.
- **Con**: Labels inside shapes (`label().font`) aren't checked.
- **Mitigation**: `missingFonts` is the only place to extend, by adding a field path, if a label font ever falls back unnoticed (YAGNI until then).

### 8. Research
- Hydrogenaudio and libmad's notes give duration = frames × samples-per-frame ÷ sample rate (1152 for MPEG-1, 576 for MPEG-2). Frame-walking is the reliable method when there is no header or the header can't be trusted.
- The `music-metadata` docs say duration sometimes needs the whole file parsed (`duration: true`), which confirms that header-only durations can be wrong.
- In CSS Fonts, family names match ASCII case-insensitively, and generic families are keywords, not installable fonts.

## Deliverables

- `src/service/tts/audio-duration.ts`: pure `audioDuration` (MP3 frame walk, WAV RIFF).
- `src/service/tts/scene-audio.ts`: `asTrack`, appended cues.
- `src/service/tools/scene-generate-speech.ts`: `asTrack` input, duration fallback chain.
- `src/model/compact.ts`, `src/service/compact/expand.ts`: compact `audioTracks`; regenerated `schemas/compact-scene.json`.
- `src/service/compact/keep-audio.ts`, `src/service/tools/scene-build.ts`: audio carry-over on overwrite, font notices.
- `src/service/font-check.ts`, `src/service/tools/scene-validate.ts`: `missingFonts`, notices.
- Tests next to their sources: `src/service/tts/audio-duration.test.ts`, `src/service/tts/scene-audio.test.ts`, `src/service/compact/keep-audio.test.ts`, `src/service/font-check.test.ts`, plus tool-level cases in `src/service/tools/scene-build.test.ts` / `scene-validate.test.ts` (created if missing).
