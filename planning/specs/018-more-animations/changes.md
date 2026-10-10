# 018 — more-animations — Changes

## 2026-10-10 — registry by family, simpler text and stagger, scope trimmed
Why: review before building against SRP, DRY and KISS: one file per animation and one kind per direction duplicate code; per-glyph state and stagger inside `animate` couple it to text and containers; underline and spotlight draw new things rather than transform the element; the easings of R7 already exist (013).
- REMOVED R4@1, R6@1, R7@1
- ADDED R9@1, R10@1
- REMOVED D1@1, D2@1, D3@1, D4@1, D5@1
- ADDED D6@1, D7@1, D8@1, D9@1, D10@1
- Tasks: T001–T011 (never started) replaced by new T001–T010
- Underline draw and spotlight focus are left for a later spec; per-glyph text motion waits for real demand.
