# 064 — tool-honesty-and-concise-results — Requirements

Agents using 063 with real scenes (2026-10-25) found that `defaults: "flat"` leaves a rect's
border glow on (a blue glow inside a 20 px border nobody asked for), that the tool descriptions
leave out paths, shot timing and camera scope, that a text in a font with no metrics is placed
by an estimated width that no tool marks as estimated, and that `scene_build` answers with two
notice lists and the whole expanded scene, thousands of characters for three rects.

- R1@1: `defaults: "flat"` also turns off the border glow of every element kind it changes (all of them have one), unless the element sets it.
- R2@1: The `scene_build` description names every kind `flat` changes (rect, ellipse, polygon, star, arrow, path) and every look it turns off (gradient, shadow, border, border glow).
- R3@1: The `shot_set` and `scene_build` descriptions state that a shot's transition runs before its `start` and after its `end`, and that its camera moves only the elements bound to that shot.
- R4@1: When a text's width comes from the fallback estimate (its font has no metrics), `scene_build` and `scene_validate` say so in a notice that points to `scene_preview`, and `scene_inspect_layout` marks that element's boxes `estimated: true`.
- R5@1: `scene_build` returns a single `notices` list, holding the build notices and the save notices without duplicates.
- R6@1: When `scene_build` saves, it returns by default only the saved name, the notices and the `id` and `kind` of each top-level element; `response_format: "detailed"` (or building without `save`) also returns the expanded scene.
- ~~R7@1: In what `scene_get` and `scene_build` return, an `anim` slot of kind `none` shows as `{ "kind": "none" }`.~~ retired 2026-10-25 → R6

## Follow-up (2026-10-25)

- R8@1: In a compact scene, a `background` string that is a CSS color (`#…`, `rgb(…)`, `hsl(…)`) gives a solid background of that color; a string that is neither a background preset nor a color keeps the default background and `scene_build` returns a notice naming it.
- R9@1: A compact `background` object starts from a solid background: `{ "color": … }` alone draws that color with no gradient, dots or light, and each of those appears only when the object turns it on (`gradient: true`, `dots: true`, `spotlight: <n>`).
- R10@1: `scene_validate` accepts a compact scene (`compact`, the same input `scene_build` takes) and checks it as `scene_build` would, with the same notices; the `scene_create` description says it takes a full scene and points to `scene_build` with `save` for the compact form.
- R11@2: `at` takes the same forms in every tool that has it (`scene_build`, `element_add`, `element_update`): an anchor name, `{ anchor, offset: [dx, dy] }` or a point `{ x, y }` the element is centred on; any other value fails with a message naming the three forms and the anchor names, and each description says so.
- R12@1: The usage skill names the italic field (`italic: true`, not `fontStyle`).
- R13@1: One name means one thing in every tool: a stored scene is always `scene` (a name; `scene_build` keeps `save`), a whole scene or recipe object passed inline is `data` (scenes) or `recipe` (presets, animation presets), a project is always `project`, and values deep-merged onto an element, scene or background are always `patch`.
- R14@1: Tool results name a project `project` too: `project_list`, `project_inspect`, `project_create` and `project_update` return the project's id as `project`, never `slug`.
