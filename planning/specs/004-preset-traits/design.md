# 004 — preset-traits — Design

## Approach

- D1@1 (implements R1, R2): Traits live in `src/traits/`, one file per trait, each exporting a `Trait` = `{ id, label, params, apply }`: `params` holds each parameter's default, and `apply` maps every kind the trait supports to a function `(el, params) => void` that sets that kind's fields (for example `glow` sets `borderGlow` on a rect and `glow` on text and lines). `src/traits/index.ts` is the registry by id.
- D2@1 (implements R3): `PresetRecipe` in `src/model/preset.ts` = `{ name, kind, traits, set? }`, where each `traits` entry is a trait id or `{ use: id, ...params }`, and `set` is a deep partial of that kind's element.
- D3@1 (implements R3, R5, R7): A pure `resolvePreset(recipe)` in `src/presets/resolve.ts` builds the element as kind default → each trait in order → deep merge of `set` → fresh id, and returns `{ element }` or `{ error }` naming the unknown or inapplicable trait. Dropping a preset adds a copy of the resolved element; nothing links it back to the recipe.
- D4@1 (implements R4, R8): Built-in recipes are JSON files in `presets/built-in/`, loaded with Vite's eager `import.meta.glob` so they are available synchronously (library, demo scene, Vitest); they are versioned with the repo and read-only from the app. User presets stay as top-level `presets/*.json` through the existing middleware. The hand-written presets module is removed.
- D5@1 (implements R6): Saving a preset from the editor writes a recipe with `traits: []` and `set` = the deep difference between the element and its kind's default, ignoring `id`.
- D6@1 (implements R7): The library renders a broken recipe as a disabled card showing the error message instead of a thumbnail.

## Deliverables

`src/traits/` (one file per trait + registry), `src/model/preset.ts`,
`src/presets/resolve.ts`, `presets/built-in/*.json` (13 recipes), library and
save-as-preset changes in `src/editor/`, removal of the hand-written presets module.

## Sequencing

Traits and recipe type → resolver → built-in recipes with an equality test captured from
`built-in.ts` before it is removed → library, demo and drop switch to recipes → save as
recipe → broken-recipe state. This spec goes before 002 and 003: 002/T007 then writes its
new built-in presets as recipes, and 003/T001's `Preset` schema validates the recipe shape.

## Open questions

- Whether traits should later be editable from the UI or shared as JSON is left for a
  future spec.
