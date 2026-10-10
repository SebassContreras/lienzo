# 020 — history-undo — Changes

## 2026-10-10 — no empty undo steps from focus
Why: found while testing 015 in the browser: the panel records a checkpoint on every focus, so a Tab after an edit pushes the edited state and the first undo does nothing visible.
- MODIFIED R2@1 → R2@2
