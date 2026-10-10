# 017 — more-elements — Changes

## 2026-10-10 — free paths and effects move to their own specs
Why: review against SRP: effects wrap every component's draw (a renderer concern, not a component), and free paths with morph are a separate feature; 18 tasks in one spec were too many to review. The window mockup and the mask both clip, so they share one helper.
- REMOVED R11@1 (→ 024/R1), R12@1 (→ 025/R1)
- MODIFIED D1@1 → D1@2, D4@1 → D4@2
- REMOVED D5@1 (→ 024/D1), D6@1 (→ 025/D1)
- Tasks: T013, T014, T015 deleted (never started; rebuilt in 024 and 025); T017 re-pointed to R1–R10; tasks covering D1@1 and D4@1 re-pointed
