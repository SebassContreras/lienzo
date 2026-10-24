# 061 — audit-docs-and-tts-cleanup — Requirements

An audit (2026-10-24) of dead code, hollow tools and documentation drift found no hollow
tool, but agent and human docs that no longer match the code, a second `localStorage` copy
of the OpenRouter key, TTS defaults repeated in the editor, a frozen pre-012 schema kept
only by tests, a tracked Python cache and one `pnpm test` run that failed with every test
green. Findings and plan are in `audit.md` next to this file.

- R1@1: `AGENTS.md`, `README.md`, `.env.example` and tool descriptions state only what the code does: both editor speech paths (dev-server proxy, or a key the user types), `--json @file`, the current `src/` layout, no fixed suite duration, no spec ids in tool descriptions, and that `dist/cli.js` must be rebuilt after pulling. `.env.example` is in English (A16).
- R2@1: Every registered component kind is described in one reference document, `docs/components.md`; `README.md` points to it instead of listing kinds, and a test fails when a registered kind is missing from it.
- R3@1: A key the user types in the editor is stored once, inside the TTS preferences; a key in the old separate `localStorage` slot is moved into the preferences on load and the slot is removed. Nothing writes or reads that slot afterwards.
- R4@1: The editor's TTS dialog takes its default models and voices from `src/service/tts/config.ts`; no default is written twice.
- R5@1: The hand-written pre-012 scene schema in `src/test/` and the test comparisons that use it are removed.
- R6@1: Generated Python caches are not tracked by Git.
- R7@1: `pnpm test` exits 0 whenever every test passes (no unhandled error after the run).
