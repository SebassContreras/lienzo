# 043 — scenes-sidebar-tab — Changes

## 2026-10-22 — audit against principles 1–10
Why: thumbnails at t = 0 hide elements with an entry animation (already fixed once in 003), and leaving the list logic "in the tab or a helper" mixes UI and logic (SRP, pure functions).
- MODIFIED D1@1 → D1@2
- MODIFIED D3@1 → D3@2
- Tasks: T001 re-pointed to D1@2 and T004 to D3@2 (not started); added T006 (tests for `scene-list`)
