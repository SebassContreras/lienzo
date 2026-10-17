# 036 — subtitles-speech-sync — Requirements

## What's being built

Timing and speech synchronization controls for the `subtitles` component. Users can adjust speech speed factors, shift cues globally, and automatically calibrate subtitle word and cue timings to match audio track durations precisely.

## Who it serves

Creators and editors producing talking-head or voiceover videos whose imported or generated captions need pacing adjustments to match the spoken speech rate perfectly.

## Requirements

- R1@2: The subtitles component inspector provides a speech synchronization section with controls for playback speed factor (`speed`: 0.5x to 2.5x) and start offset (`startOffset`).
- R2@1: Changing the speech speed factor recalculates all cue `start` and `end` times, as well as per-word timestamps (`words: [{ word, start, end }]`), scaling them proportionally from a chosen origin.
- ~~R3@1: A one-click "Ajustar al audio" (Fit to audio) action calculates the exact speed ratio required to stretch or compress subtitle cues to match the duration of a selected scene audio track.~~ retired 2026-10-17
- ~~R4@1: Cue timing edits support relative shifting (delaying or advancing all subsequent cues by N milliseconds) to fix audio drift without manually editing every single entry.~~ retired 2026-10-17
- R5@1: Keyframe tracks and animation progress on subtitles remain locked to canvas time `t` while cue text rendering respects the recalibrated speech timestamps.

## Out of scope

- Phoneme-level acoustic forced alignment from raw audio waveforms in browser.
- External cloud speech recognition re-processing.

## Dependencies

027, 028.

## Owner split

All tasks agent.
