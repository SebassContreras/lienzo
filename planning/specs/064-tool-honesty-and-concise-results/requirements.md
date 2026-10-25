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
