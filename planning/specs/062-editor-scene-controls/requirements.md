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
