# 008 — cli — Design

## Approach

- D1@1 (implements R1, R3): `src/cli/main.ts` is a generic adapter over the registry: flags map onto the tool's Zod input (`z.toJSONSchema` gives names and types), `--json` passes the whole input; no per-tool code.
- D2@1 (implements R2): Help text is generated from each tool's description and input schema.

## Deliverables

`src/cli/main.ts`, the `lienzo` pnpm script (run with `tsx`, A22).
