# 008 — cli — Changes

## 2026-10-10 — flags only for top-level scalars
Why: mapping nested Zod input onto flags is fragile; `--json` already covers nested input, and `node:util.parseArgs` avoids a dependency (KISS).
- MODIFIED D1@1 → D1@2
- Tasks: T001, T003 (never started) re-pointed to D1@2; T001 re-pointed to A20@2
