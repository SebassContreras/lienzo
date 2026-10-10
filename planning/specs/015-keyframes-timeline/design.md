# 015 — keyframes-timeline — Design

## Approach

- ~~D1@1 (implements R1, R3): `el.tracks: { [propertyPath]: Keyframe[] }`; descriptors declare the animatable paths (A23).~~ retired 2026-10-10 → D5
- ~~D2@1 (implements R2, R6): `animate` evaluates tracks first (with `src/engine/easing.ts`), then preset animations (A24).~~ retired 2026-10-10 → D6
- ~~D3@1 (implements R4, R5): The timeline panel lives in `src/editor/timeline/`, separate from the stage and the inspector; the inspector writes to the keyframe under the playhead.~~ retired 2026-10-10 → D7
- ~~D4@1 (implements R7): The example is a scene file in `scenes/examples/`.~~ retired 2026-10-10 → D9
- D5@1 (implements R1, R3): `el.tracks: { [path]: Keyframe[] }` with `Keyframe = { t, value, easing }`, optional and `{}` by default so older scenes read; a path is an animatable field path from the descriptor (A23; whole-number fields join them) or a transform channel, `@rotate` (degrees) or `@scale` (factor), which have no field. Positions are not bounded, so off-canvas needs nothing. Elements inside a particle template keep no motion (014: the template is still), so their tracks are ignored there.
- D6@1 (implements R2, R6): `src/engine/tracks.ts` is the one pure module for tracks: evaluate a track at `t` (a segment uses its first keyframe's easing from `src/engine/easing.ts`; colors mix in RGB with a small helper of its own, no library; whole numbers step), and set, move and delete keyframes, including `writeAt(el, path, value, t)`, which sets the keyframe at `t` when the path has a track and the field otherwise. `animate` applies the tracks first, field paths onto a copy of the element and channels added to the transform the way 018's kinds compose, then the preset animation (A24). The service tools (007) and animation presets (019) use the same module.
- D7@1 (implements R5, R8, R9): The inspector reads values from the element as evaluated at the playhead and writes through `writeAt`; a keyframe button next to each animatable field adds or removes its track; every change goes through the editor's existing undo stack.
- D8@1 (implements R4, R9): `src/editor/timeline/` shows only the selected element's tracks as rows of keyframe marks under the existing scrub bar and clock (no second playhead); clicking a mark selects it and seeks there, dragging moves it, Delete removes it, and a select sets its easing. No multi-element tracks or editable curves.
- D9@1 (implements R7): The example is a scene file in `scenes/`, checked against the scene schema in a test.

## Deliverables

`src/engine/tracks.ts`, track evaluation in `animate`, inspector keyframe buttons and
`writeAt`, timeline panel, example scene.
