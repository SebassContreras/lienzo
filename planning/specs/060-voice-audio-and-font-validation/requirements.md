# 060 — voice-audio-and-font-validation — Requirements

## Context & Motivation

When automating videos with synthetic narration and custom typography (found during `ringana-omega` in issues #10, #11, and #12):

> **GitHub Issue #10:** *scene_generate_speech replaces scene.audio instead of appending a track*
> Each `scene_generate_speech` call overwrites `scene.audio`, so a voice-over with one clip per shot had to be written by hand into `audioTracks` with `startOffset`. A later `scene_build` + `overwrite` erases those tracks, and they had to be copied by hand again into a redesigned scene (`videos/ringana-omega/learnings.md`).
> **Expected:** `scene_generate_speech` appends a track with a given `startOffset` (`asTrack: true`), and `scene_build` keeps existing `audioTracks` (or accepts them in compact scenes).

> **GitHub Issue #11:** *audioDuration reports a wrong length*
> A merged clip reported `audioDuration` 1.5 s but sounds for about 2.7 s in the export (measured with `ffmpeg -af silencedetect`). Found during `videos/ringana-omega/learnings.md`.
> **Expected:** `audioDuration` matches the audible length of the clip through true audio header/frame parsing.

> **GitHub Issue #12:** *A font that is not installed falls back to a serif with no warning*
> Montserrat rendered as a serif until `font_install` was run for the project; `scene_build` and `scene_preview` gave no warning. Found during `videos/ringana-omega/learnings.md`.
> **Expected:** `scene_build` / `scene_validate` warns when a text or subtitles element uses a font that is not installed in the project.

## Requirements

- R1@1: `scene_generate_speech` supports an `asTrack: boolean` option (default `false`); when `asTrack: true`, it appends a new audio track to `scene.audioTracks` (preserving existing tracks and `scene.audio`) with the given `assetId`, `startOffset`, and `volume`.
- R2@1: `scene_generate_speech` computes the precise duration of synthesized audio by parsing the audio container/frame headers (MP3/WAV duration metadata) instead of using a constant byte-rate estimate, ensuring `audioDuration` matches the true audible duration.
- R3@1: Compact scenes accept an optional `audioTracks` array, and `scene_build` preserves existing `scene.audioTracks` when expanding a scene unless explicitly overwritten.
- R4@1: `scene_validate` and `scene_build` check all font families referenced by `text` and `subtitles` elements against the bundled `@fontsource` fonts, global `fonts/`, and project `projects/<slug>/fonts/`, returning a diagnostic warning notice when an uninstalled font family is detected.

## Out of Scope

- Real-time in-browser font downloading during export without calling `font_install` first.
- Audio waveform visualization inside the inspector.

## Dependencies

028, 035, 045.

## Owner Split

All tasks agent.
