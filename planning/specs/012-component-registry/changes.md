# 012 — component-registry — Changes

## 2026-10-24 — legacy schema oracle retired
Why: the hand-written pre-012 schema only guarded kinds that existed in 012; 061/D5@1 removes it.
- Tasks: 061/T007 deletes `src/test/legacy-schema.ts` and its comparisons (part of T015)
