# 044 — nested-asset-drag — Changes

## 2026-10-22 — audit against principles 1–10
Why: the path check was going to live in the route only while `validateAsset` keeps its own (DRY, pure function), and `validateAsset` keeps only the file name, so nested assets would still fail to validate.
- ADDED R5@1
- MODIFIED D2@1 → D2@2
- ADDED D5@1
- Tasks: T002 re-pointed to D2@2 (not started); added T006 (fix `validateAsset`) and T007 (regression test)
