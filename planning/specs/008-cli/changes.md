# 008 — cli — Changes

## 2026-10-10 — flags only for top-level scalars
Why: mapping nested Zod input onto flags is fragile; `--json` already covers nested input, and `node:util.parseArgs` avoids a dependency (KISS).
- MODIFIED D1@1 → D1@2
- Tasks: T001, T003 (never started) re-pointed to D1@2; T001 re-pointed to A20@2

## 2026-10-12 — friction found building the CLI
Why: inline JSON is painful to quote in PowerShell; the CLI's own errors were English while the tools' are Spanish; the descriptors imported a Vite-only `?url` font, so the registry did not load under `tsx`.
- MODIFIED D1@2 → D1@3
- ADDED D3@1
- Tasks: T005, T006 added; T001, T003 re-pointed to D1@3 (still valid)
