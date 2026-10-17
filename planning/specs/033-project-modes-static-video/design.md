# 033 — project-modes-static-video — Design

## Approach

- D1@1 (implements R1): Add an optional `mode` property (`'static' | 'video'`, defaulting to `'video'`) to the `Scene` type in `src/model/model.ts` and validate it in `SceneSchema` in `src/model/schema.ts`.
  - _Trade-off_:
    - *Pro*: Full backwards compatibility with all existing saved scenes and presets; schema validation prevents invalid values.
    - *Con*: Undefined in older scene JSON files.
    - *Mitigation*: Pure helper `isStaticMode(scene)` treats `undefined` or any non-`'static'` value as `'video'`.
- D2@1 (implements R2): Add a mode toggle switch/selector ("Diseño / Imagen" vs "Video / Animación") in the top navigation bar (`src/editor/app.tsx`) and in scene creation dialogs (`src/presets/scene-files.tsx`).
  - _Trade-off_:
    - *Pro*: Users can switch context instantaneously at any moment or choose intent upfront when creating new scenes.
    - *Con*: Switching a video scene containing keyframes to static mode might confuse users about whether data is lost.
    - *Mitigation*: The switch only adjusts workspace presentation and export defaults; existing animation tracks and audio remain intact in JSON unless explicitly cleared.
- D3@1 (implements R3): Conditionally render the bottom timeline, playback controls, loop controls, and audio track controls in `src/editor/app.tsx` based on `!isStaticMode(scene)`.
  - _Trade-off_:
    - *Pro*: Cleans up cognitive clutter for static graphic post design.
    - *Con*: Canvas height might experience layout jump when timeline unmounts.
    - *Mitigation*: Flexbox layout with stage taking `flex: 1` smoothly absorbs height difference.
- D4@1 (implements R4): In `src/editor/field-editor.tsx` and `src/editor/inspector.tsx`, hide animation preset selectors, keyframe track controls, and channel key buttons when `isStaticMode(scene)` is active.
  - _Trade-off_:
    - *Pro*: Element property panel stays focused purely on graphic styling (fill, stroke, shadow, typography, dimensions).
    - *Con*: An element with existing keyframes won't show keyframe badges while in static mode.
    - *Mitigation*: Switching back to video mode immediately restores all badges and timeline track views.
- D5@1 (implements R5): In `src/export/export-controls.tsx`, inspect `scene.mode`. When in `'static'` mode, default format to `"png"` and disable/hide `"mp4"` and `"gif"` options with a clear tooltip/notice.
  - _Trade-off_:
    - *Pro*: Prevents accidental multi-second headless video rendering for static assets.
    - *Con*: User wanting to export 1 frame of an animation as PNG vs exporting a static scene share the same PNG path.
    - *Mitigation*: Keep PNG generation uniform and fast via standard canvas snapshot.
- D6@1 (implements R6): Expose `mode` in `src/service/tools/scene-create.ts`, `scene-export.ts`, and validate in MCP schema descriptions so agents understand not to generate keyframes or speech audio for static scenes.
  - _Trade-off_:
    - *Pro*: LLM agents receive direct structural guidance on whether to generate animations/audio.
    - *Con*: Agent could still attempt to invoke `scene_generate_speech`.
    - *Mitigation*: Add an advisory validation warning or error in audio/speech tools when invoked on a static scene.

## Deliverables

- `src/model/mode.ts`: Pure helper `isStaticMode(scene?: { mode?: string })` and `SceneMode` type.
- `src/model/model.ts` & `src/model/schema.ts`: `mode` field on `Scene` and `SceneSchema`.
- `src/editor/mode-selector.tsx`: Topbar mode toggle component.
- `src/editor/app.tsx`: Mode state wiring, hiding timeline in static mode.
- `src/editor/inspector.tsx` & `src/editor/field-editor.tsx`: Filtering out animation sections in static mode.
- `src/export/export-controls.tsx`: Format selector restriction in static mode.
- `src/service/tools/scene-create.ts` & `src/service/tools/scene-export.ts`: Mode awareness for CLI & MCP.
- Unit tests in `src/model/mode.test.ts` and `src/export/export-controls.test.tsx`.

## Sequencing

1. Domain model & schema (`mode.ts`, `model.ts`, `schema.ts`) first.
2. Service tools (`scene-create`, `scene-export`).
3. Editor UI components (mode toggle, timeline conditional rendering, inspector filtering, export controls).
4. Unit tests and verification.

## Open questions

_None._
