# 026 — audio-track — Requirements

## What's being built

An audio track for scenes: support for attaching an audio file (speech, music, sound
effects) to any scene, playback synchronized with the editor playhead and timeline scrub,
and audio multiplexing into MP4 and WebM video exports using Mediabunny.

## Who it serves

Creators producing animated videos with voiceovers, background music, or sound cues.

## Requirements

- R1@1: A scene can include an optional `audio` track property specifying an asset ID (`assets/`), volume (0 to 1), `startOffset` (seconds in scene when audio begins), and `trimOffset` (offset into source audio).
- R2@1: Audio files (`.mp3`, `.wav`, `.aac`, `.ogg`) can be uploaded and stored as content-hashed assets in `assets/`, using the existing asset server endpoint.
- R3@1: In the editor, playing, pausing, scrubbing, and looping the scene timeline plays the scene audio in exact synchronization with canvas time `t` using the Web Audio API.
- R4@1: Exporting to MP4 or WebM via `mediabunny` multiplexes the scene audio into the video container, matching the video duration and offsets.
- R5@1: Headless video export (`scene_export` tool and CLI) includes the audio track when rendering through Playwright / headless Chromium.
- R6@1: The editor UI displays an audio track control in the timeline or stage toolbar with options to attach, replace, remove, mute, or adjust volume and start offset.

## Out of scope

- Multi-track audio DAW editing or complex DSP effects (reverb, equalizer).
- Direct audio waveform editing or slicing in the canvas.

## Dependencies

001, 007, 010.

## Owner split

All tasks agent.
