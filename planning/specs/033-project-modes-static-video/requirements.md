# 033 — project-modes-static-video — Requirements

## What's being built

A project mode selector and scene-level property (`mode: 'static' | 'video'`) that differentiates between static image/photo compositions and animated videos. When creating or switching to static mode, the UI hides the timeline, playback controls, and audio tracks, presenting a clean graphic design workspace. Headless export, CLI, and MCP tools also respect this mode to avoid generating unnecessary animation tracks or audio for static posts.

## Who it serves

Creators and social media managers who want to design static posts, carousels, or banners without the distraction and cognitive overhead of a video timeline and playback bar.

## Requirements

- R1@1: A scene can include an optional `mode` property with values `'static' | 'video'` (defaults to `'video'` for backwards compatibility, or `'static'` when explicitly set).
- R2@1: The new scene dialog and top navigation bar provide a clear project mode toggle/selector between "Diseño / Imagen" (static) and "Video / Animación" (video).
- R3@1: In `'static'` mode, the editor hides the bottom playback bar, loop controls, timeline scrubber, and audio tracks, focusing solely on the canvas and stage controls.
- R4@1: In `'static'` mode, element inspectors hide animation-specific properties (preset animations and keyframe timelines) to simplify property inspection.
- R5@1: The export modal defaults to PNG/JPEG image export when in `'static'` mode, and disables MP4/GIF video options unless switched to video.
- R6@1: Service layer tools (`scene_create`, `scene_export`, `scene_preview`) and MCP schema surface the `mode` property so AI agents do not propose or add animated keyframes/audio tracks to static image scenes.

## Out of scope

- Multi-page PDF document generation.
- Dynamic responsive canvas auto-resizing during mode toggling.

## Dependencies

001, 007, 031.

## Owner split

All tasks agent.
