# 055 — shots-and-camera — Requirements

Multi-shot videos currently require faking shots with full-screen groups, duplicated time windows, and manual 0.1 s fades, while `at` ignores parent group dimensions, `scene_inspect_layout` reports false warnings on invisible off-shot elements, and the layers panel becomes hard to navigate with ~100 nested elements.

- R1@1: A scene supports an optional `shots` array (`[{ id, name, start, end, transition?: { kind: "cut" | "fade" | "slide" | "zoom", duration: number }, camera?: { x?: number, y?: number, zoom?: number, tracks?: ... } }]`), and top-level elements support an optional `shot: "<id>"` binding.
- R2@1: During rendering at time `t`, elements bound to a `shot` are only active within their shot's `[start, end]` window (plus any active transition overlap), and the shot's `camera` (`x`, `y`, `zoom` and camera keyframe tracks) transforms the stage view for that shot; elements without `shot` render across the whole scene as before.
- R3@1: A `shot_set` service tool (and compact scene `shots` support) lets agents create, update, or remove shots and their transitions/camera on a scene, and the editor timeline displays shots as distinct blocks.
- R4@1: In compact scenes, `at` on an element inside a `group` resolves relative to that parent group's `w × h` (`cw × ch`) instead of the root scene's dimensions.
- R5@1: `scene_inspect_layout` at time `t` skips elements whose effective opacity is `0` at `t` (before `in`, after `out`, outside their `shot`, or with `opacity === 0`), and tags every layout diagnostic with the element's `shot` (when present).
- R6@1: The editor's layers panel (`src/editor/layers-panel.tsx`) provides a text search filter by element name/id, collapsible grouping by `shot`, and auto-expands/scrolls to reveal an element when it is selected on the canvas.
