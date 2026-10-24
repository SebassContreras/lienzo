# 062 — editor-scene-controls — Design

## Approach

- D1@1 (implements R1, R5): The shot rules of `shot_set` (create, update, camera merge, order by `start`, `end` not before `start`) move to pure functions `setShot` and `removeShot` in `src/model/shots.ts`; the tool and the editor both call them, so they write the same JSON by construction. Trade-off: touches a working tool — mitigated by tests of today's behaviour written with the move.
- D2@1 (implements R1): A "Tomas" section in the scene inspector (`src/editor/scene/shots-section.tsx`) lists shots and edits name, start, end, transition and camera `x`, `y`, `zoom`; the element inspector of a top-level element gets a "Toma" select writing `el.shot`. Camera keyframe tracks stay in `shot_set` and the JSON (YAGNI). Every change goes through the editor's undoable scene update.
- D3@1 (implements R2): Pure `symbolFromGroup` and `replaceWithUse` in `src/model/symbols.ts` turn the selected group into a `scene.symbols` entry (children relative to the group's box) and put a `use` of the same box in its place; `use.symbol` is picked with a `symbol-select` widget listing the scene's symbols.
- D4@1 (implements R2): "Editar símbolo" swaps the stage to a temporary scene of the symbol's size holding its children and "Volver" writes them back into `scene.symbols`, so every instance updates; it reuses the whole editor instead of a second one. Trade-off: the main scene is hidden while editing — mitigated by a banner with the symbol name and instance count, and the edit is one undo step. _(judgement, no standard; mirrors Figma's "edit main component")_
- D5@1 (implements R3): Each track lane header has a `repeat` select (`none`, `loop`, `pingpong`) and an `until` number, written with `trackEntry` (`src/model/track.ts`), the function `keyframe_set` uses.
- D6@1 (implements R4): An `origin` widget (3×3 anchor grid plus numeric `x`, `y`) in the inspector maps anchors with `resolveOrigin`, the compact format's table, instead of a second copy. _(standard: CSS transform-origin — https://developer.mozilla.org/docs/Web/CSS/transform-origin)_

## Sequencing

Pure functions (D1, D3) before the UI that uses them; the equivalence test after both.

## Follow-up (2026-10-24)

- D7@1 (implements R6): `SceneInspector` takes a `symbolMode` flag that renders only "Ancho" and "Alto"; "Volver" writes the temporary scene's width and height into the symbol with the children. Trade-off: the background cannot be previewed per symbol — acceptable, a symbol has none of its own.
- D8@1 (implements R7): Text fields accept an optional `widget`, as select fields already do (`font`); `use.symbol` is a `text` field with `widget: "symbol"`, so its schema and `component_list` entry are a plain string again. Trade-off: one more optional key on `TextField` — it mirrors the existing `SelectField.widget`, no new abstraction.
- D9@1 (implements R8): A key button next to camera `x`, `y` and `zoom` toggles a keyframe at the playhead through a pure `toggleCameraKey(shot, axis, t)` in `src/model/shots.ts` (built on `withKeyframe` / `keyframeAt`), and the result goes through `setShot` as a `camera.tracks` patch, the same path `shot_set` takes. Camera tracks use scene time, as `resolveShotCamera` reads them. Trade-off: no lanes for camera tracks in the timeline — the key button shows whether the playhead sits on a key, and moving keys stays in `shot_set`/JSON (YAGNI until asked).
