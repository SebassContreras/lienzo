# 039 — codebase-fixes-and-optimization — Changes

## 2026-10-22 — lint back to green
Why: `pnpm lint` (A14, A15) fails with 66 errors left by specs 036–041 in files they touched, so CI cannot pass; no decision changes, only the code is brought back to the rules.
- Tasks: ADDED T009
