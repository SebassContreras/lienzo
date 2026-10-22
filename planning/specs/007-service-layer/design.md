# 007 — service-layer — Design

## Approach

- D1@1 (implements R1): `defineTool` and the registry live in `src/service/`; a tool has `name`, `description`, Zod `input` and `output`, and `run(input, ctx)`; `ctx` holds the repo root, the store and (from 010) the renderer, so tests inject a temp dir.
- D2@2 (implements R2, R5): The file operations of `src/presets/json-store.ts` are extracted into plain `fs` functions shared by the Vite middleware and `ctx.store` (no copy); a Node loader reads `presets/built-in/` instead of `import.meta.glob`.
- D3@2 (implements R3): Adding an element reuses `resolveElement`, `defaultElement` and `centerOn`; the new element gets a fresh id, returned by the tool; patches deep-merge like `deepMerge` in `src/presets/resolve.ts`; `element_update` accepts `at` and applies the same `centerOn` after the patch; the element tools' descriptions state that `x, y` is the top-left of the element's box and that a text's `align` aligns its lines inside its own box.
- D4@1 (implements R4): Every write goes through `parseScene` / `parsePresetRecipe` (`src/model/schema.ts`) before touching disk; errors are `{ code, message, path }`, messages in Spanish (A16), tool descriptions in English (read by the model).

- D5@1 (implements R6): Element tools take their input schemas from the descriptor registry (A23) and add or edit keyframes through the track model of 015.
- D6@1 (implements R7): Tools load `presets/animations/` through `ctx.store` and call `expandAnimPresets` (019/D10) before `parseScene`.

## Deliverables

`src/service/` (registry, ctx, store, built-in loader), `src/service/tools/*.ts`.

## Sequencing

Registry and ctx → shared `fs` store functions (T012) → store and loader → read tools → write tools → tests.

## Trade-offs

- **`x, y` stays the top-left of the box for every kind (text included).**
  - *Pros:* no scene or preset changes; matches Canvas 2D, SVG `<rect>`, Figma and Konva; one rule for `boxOf`, snapping and alignment.
  - *Cons:* not obvious to an agent that writes coordinates by hand, especially for centred text whose width depends on the font.
  - *Mitigation:* the element tool descriptions state the convention, and `at` (on add and update) centres by the measured box so nobody computes widths.
- **`at` on `element_update` is applied after the patch.**
  - *Pros:* a size or text change and the re-centring land in one call, on the final box.
  - *Cons:* an `x`/`y` in the same patch is overridden.
  - *Mitigation:* the description says `at` wins.
