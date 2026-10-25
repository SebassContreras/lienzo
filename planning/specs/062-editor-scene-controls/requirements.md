# 062 — editor-scene-controls — Requirements

An audit (2026-10-24) found that the tools and compact scenes support shots and camera
(055), symbols (056), keyframe track loops (052) and the transform origin (053), but the
editor has no controls for them: they can only be set through the tools or the scene JSON,
and the layers panel only groups elements by shot.

- R1@1: The editor lists the scene's shots and lets the user add, rename, retime and remove a shot, set its transition and its camera (`x`, `y`, `zoom`), and bind or unbind the selected top-level element to a shot; every change is undoable.
- R2@1: The editor lists the scene's symbols, creates a symbol from the selected group, and edits a symbol's children so every `use` instance updates; a `use` element's `symbol` is chosen from that list.
- R3@1: The keyframe tracks panel sets a track's `repeat` (`none`, `loop`, `pingpong`) and `until`.
- R4@1: The inspector sets an element's `origin` with the nine named anchors and numeric `x`, `y`.
- R5@1: Each editor change produces the same scene JSON the matching tool (`shot_set`, `keyframe_set`, `element_update`) would produce.
- R6@1: While a symbol is being edited, the scene inspector shows only the canvas width and height, which become the symbol's `w` and `h` on return; the shots, background and other scene settings are hidden, so no edit is silently dropped.
- ~~R7@1: `component_list` and the scene schema report `use.symbol` as a text field, as before this spec; the editor still picks it from the scene's symbols.~~ retired 2026-10-24 → R9
- R9@1: `use.symbol` is a text field in its descriptor (a plain string, no closed option list) that the editor picks from the scene's symbols, and every widget a text or select field names exists in the editor.
- R8@1: The "Tomas" section sets or removes a camera keyframe for `x`, `y` or `zoom` at the playhead, written to the shot's `camera.tracks` exactly as `shot_set` writes a `camera.tracks` patch.

## Follow-up (2026-10-25)

A parity audit found editor actions with no tool, and a tool diagnostic the editor never shows.

- R10@1: `scene_update` patches a saved scene's `width`, `height`, `duration`, `fps`, `mode`, `audio`, `audioTracks` and `symbols`, deep-merged as `element_update` merges, where a `null` value removes a key; `elements` and `shots` are refused (their own tools edit them).
- R11@1: `scene_rename` and `scene_delete` rename and delete a project scene as the "Escenas" tab does.
- R12@1: `preset_save` writes a validated preset recipe into the project's presets, and `preset_rename` and `preset_delete` rename and delete a project preset; built-in presets are refused.
- R13@1: `animation_list` lists the animation presets and `animation_save` saves one, validated as the editor's import validates it.
- R14@1: `project_update` changes a project's name, description, brand guide and palette as the brand dialog does.
- R15@1: `asset_add` copies a local file into `projects/<slug>/assets/` (optionally a subfolder) with the upload's extension list, and `font_install` also installs a local font `file`.
- R16@1: `element_group` groups the given elements as Ctrl+G does, and `element_ungroup` ungroups a group as Ctrl+Shift+G does.
- R17@1: A "Revisar escena" button in the editor lists the open scene's `scene_inspect_layout` diagnostics.
- R18@1: Each new scene, preset and element tool produces the same JSON as the editor function it mirrors.
