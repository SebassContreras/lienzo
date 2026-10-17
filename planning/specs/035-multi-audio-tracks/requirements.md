# 035 — multi-audio-tracks — Requirements

## What's being built

Support for multiple stacked audio tracks in a scene. The timeline UI allows users to add multiple audio layers (voiceover narration, background music, sound effects) via a `+` button under the playback bar, configure independent start/trim offsets and volume/mute per track, and mix them together seamlessly during real-time playback and video export.

## Who it serves

Video creators producing rich animated social media posts who need layered sound: voiceovers with background music ducking or sound effects at specific timestamps.

## Requirements

- R1@1: The scene model schema supports a list of audio tracks (`audioTracks: AudioTrackItem[]`), while maintaining backwards compatibility with legacy single-track `scene.audio`.
- R2@1: Each `AudioTrackItem` specifies an asset ID (`assets/`), name or label, volume (0 to 1), `startOffset` (seconds in scene), `trimOffset` (seconds into file), and a `muted` boolean flag.
- R3@1: Below the playback bar in the timeline, users can add new audio tracks via a `+ Añadir audio` button, delete tracks, and rearrange them vertically.
- R4@1: Each audio track in the timeline renders an interactive track strip with a volume slider, mute toggle, timing offset controls, and a remove button.
- R5@1: Real-time playback using Web Audio API mixes all active (unmuted) tracks in exact synchronization with canvas time `t`, scrubbing, and looping.
- R6@1: Video export via Mediabunny (and headless render via Playwright) mixes all active audio tracks into the final container with correct relative start and trim timings.

## Out of scope

- Direct visual waveform cutting/slicing or cross-fade curves in canvas.
- Complex audio DSP filters (reverb, compression, equalizers).

## Dependencies

026, 007, 010.

## Owner split

All tasks agent.
