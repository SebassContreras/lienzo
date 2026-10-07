# 006 — background-presets — Design

## Approach

- D1@1 (implements R1): A "Fondo" button in the header clears the selection and opens the scene inspector scrolled to its "Fondo" section; with nothing selected, the empty canvas shows the hint "Clic en un área vacía para editar el fondo".
- D2@1 (implements R3, R6): `PresetRecipe.kind` (004/D2@1) gains `"background"`; traits may define `apply.background`; `resolvePreset` starts a background recipe from `defaultBackground()`, factored out of `defaultScene()`, and returns a background instead of an element. Applying it copies the values into `scene.background`.
- D3@1 (implements R2): The library's "Fondos" section lists background recipes, each thumbnail drawn with `drawScene` on an empty scene with that background; clicking one records an undo checkpoint and applies it.
- D4@1 (implements R4): "Guardar fondo como preset" in the "Fondo" inspector section writes a recipe with `traits: []` and `set` = the deep difference from `defaultBackground()`, as element presets do (004/D5@1).
- D5@1 (implements R5): Built-in background recipes in `presets/built-in/` (at least "Azul noche" = today's default, "Negro liso", "Degradado violeta", "Puntos sobre gris", "Foco central"), using background traits for solid color, gradient, dots and spotlight.

## Deliverables

`defaultBackground()`, background support in recipes, traits and `resolvePreset`,
"Fondo" button and canvas hint, "Fondos" library section, save-background action,
built-in background recipes.

## Sequencing

After 004 (recipes, traits, resolver). Model and resolver → background traits and
built-in recipes → "Fondo" button → "Fondos" section → save action. Goes before 005,
whose full-canvas particles leave no empty canvas to click.
