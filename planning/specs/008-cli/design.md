# 008 — cli — Design

## Approach

- D1@2 (implements R1, R3): `src/cli/main.ts` is a generic adapter over the registry: top-level scalar fields of the tool's Zod input become flags parsed with `node:util.parseArgs` (`z.toJSONSchema` gives names and types); nested input goes through `--json`; no per-tool code and no CLI library.
- D2@1 (implements R2): Help text is generated from each tool's description and input schema.

## Deliverables

`src/cli/main.ts`, the `lienzo` pnpm script (run with `tsx`, A22).
