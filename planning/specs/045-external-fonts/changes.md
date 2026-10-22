# 045 — external-fonts — Changes

## 2026-10-22 — audit against principles 1–10
Why: splitting the file name on the first `-` breaks hyphenated families; the upload and Google routes held the logic instead of one store and one adapter (A20, adapter with injected `fetch`); A12@1 forbade any font outside `@fontsource`.
- MODIFIED D1@1 → D1@2
- MODIFIED D5@1 → D5@2
- MODIFIED D6@1 → D6@2
- Tasks: T001 → D1@2, T005 → D5@2, T006 → D6@2 (not started); added T008 (Google Fonts adapter tests); A12@1 → A12@2 in planning/changes.md
