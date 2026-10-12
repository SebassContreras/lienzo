# 008 — cli — Design

## Approach

- D1@3 (implements R1, R3): `src/cli/main.ts` is a generic adapter over the registry: top-level scalar fields of the tool's Zod input become flags parsed with `node:util.parseArgs` (`z.toJSONSchema` gives names and types); nested input goes through `--json`, given inline, as `@file` or as `-` (stdin) so no shell has to quote JSON; a flag for a field that takes text or a number is a number only when it reads as one; errors are `{ code, message, path }` JSON with Spanish messages like the tools' (A16); no per-tool code and no CLI library.
- D3@1 (implements R1): Everything the descriptors import loads in plain Node under `tsx`: no Vite-only imports (`?url`, `?raw`, `import.meta.glob`); static files the components need live in `public/`; a test runs the real CLI process to keep it so.
- D2@1 (implements R2): Help text is generated from each tool's description and input schema.

## Deliverables

`src/cli/main.ts`, the `lienzo` pnpm script (run with `tsx`, A22).
