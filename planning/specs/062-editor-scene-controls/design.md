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
