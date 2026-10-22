# 044 — nested-asset-drag — Changes

## 2026-10-22 — audit against principles 1–10
Why: the path check was going to live in the route only while `validateAsset` keeps its own (DRY, pure function), and `validateAsset` keeps only the file name, so nested assets would still fail to validate.
- ADDED R5@1
- MODIFIED D2@1 → D2@2
- ADDED D5@1
- Tasks: T002 re-pointed to D2@2 (not started); added T006 (fix `validateAsset`) and T007 (regression test)

## 2026-10-22 — regression found in the full test run
Why: `assetSegments` only looked for `/assets/`, so `assets/x.png` references stopped validating.
- Tasks: added T008 (fix + test)

## 2026-10-22 — folder browsing and real-world asset names
Why: projects organised in subfolders with descriptive names (`products/CAPS move/01 - Close-up….png`) showed a grid of truncated paths with no thumbnails: the strict segment pattern refused spaces, so nothing could be seen or dragged.
- ADDED R6@1, R7@1
- MODIFIED D2@2 → D2@3
- MODIFIED D3@1 → D3@2
- ADDED D6@1
- Tasks: T002 re-pointed to D2@3 and T003 to D3@2 (still valid); added T009, T010, T011, T012
