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
