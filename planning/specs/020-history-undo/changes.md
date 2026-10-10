# 020 — history-undo — Changes

## 2026-10-10 — no empty undo steps from focus
Why: found while testing 015 in the browser: the panel records a checkpoint on every focus, so a Tab after an edit pushes the edited state and the first undo does nothing visible.
- MODIFIED R2@1 → R2@2

## 2026-10-10 — cap of 75 states
Why: user decision: between today's 200 and the 50 in R6@1, 75 keeps enough steps for long sessions with bounded memory.
- MODIFIED R6@1 → R6@2
- Tasks: T002, T005 (never started) re-pointed
