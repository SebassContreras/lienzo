# 063 — shot-render-and-honest-defaults — Requirements

Agents testing 055 and 058 with real scenes (2026-10-25) found that shot transitions are never
drawn, that the shot camera is applied twice inside groups and also moves elements bound to no
shot, that text placed with `at` and no `w` is measured narrower than it is drawn, and that
several defaults surprise without a notice. The skills work around all of these today. A
parity audit also found that assets cannot be renamed or deleted, and that the editor never
shows `scene_validate` notices.

- R1@1: During a shot's transition window, `fade` blends the outgoing and incoming shots by opacity, `slide` moves the incoming shot in from the scene edge while the outgoing one moves out, and `zoom` scales the incoming shot in from the center; `cut` (or no transition) switches with no blending.
- R2@1: A shot's camera transforms each element bound to that shot exactly once, at any group depth: with `zoom: 2`, a group and its children appear exactly as an ungrouped copy of the same elements would.
- R3@1: Elements with no `shot` (subtitles, logos, overlays) are never moved by any shot camera.
- R4@1: For a `text` with no `w`, the width layout reports matches the width the renderer draws, within 1 px per line, both in the editor and in Node-side export.
- R5@1: Engine-wide, a new shape's `fill.opacity` defaults to `1` and a `path`'s stroke (`border.width`) defaults to `0`; `defaults: "flat"` also turns off a path's stroke.
- R6@1: `scene_validate`, `scene_build` and the compact expansion return a notice for each input field they ignored, naming its path (e.g. `elements[3].glw`).
- R7@1: `asset_rename` renames or moves a project asset and rewrites every reference to it in the project's scenes; `asset_delete` deletes an asset but refuses while any scene references it, listing those scenes, unless `force` is set. The editor's assets tab does both through the same service functions.
- R8@1: The editor shows the open scene's `scene_validate` notices, the same list the tool returns, and clicking a notice that names an element selects it.
- R9@1: The usage skill documents duplicating (`scene_get` + `element_add`) and aligning (`scene_inspect_layout` + `element_update`) as compositions of existing tools; no new tool is added for them.
- R10@1: Existing scenes and presets render as before, apart from the new defaults in R5; once R1–R5 hold, the skill workarounds (fades with `anim/opacity`, `@scale` on a group instead of the camera, explicit `stroke: 0`) are removed.
