# 007 — service-layer — Design

## Approach

- D1@1 (implements R1): `defineTool` and the registry live in `src/service/`; a tool has `name`, `description`, Zod `input` and `output`, and `run(input, ctx)`; `ctx` holds the repo root, the store and (from 010) the renderer, so tests inject a temp dir.
- D2@1 (implements R2, R5): `ctx.store` reads and writes `presets/` and `scenes/` through the logic of `src/presets/json-store.ts`; a Node loader reads `presets/built-in/` instead of `import.meta.glob`.
- D3@1 (implements R3): Adding an element reuses `resolveElement`, `defaultElement` and `centerOn`; the new element gets a fresh id, returned by the tool; patches deep-merge like `deepMerge` in `src/presets/resolve.ts`.
- D4@1 (implements R4): Every write goes through `parseScene` / `parsePresetRecipe` (`src/model/schema.ts`) before touching disk; errors are `{ code, message, path }`, messages in Spanish (A16), tool descriptions in English (read by the model).

## Deliverables

`src/service/` (registry, ctx, store, built-in loader), `src/service/tools/*.ts`.

## Sequencing

Registry and ctx → store and loader → read tools → write tools → tests.
