# 013 — animation-playback — Changes

## 2026-10-10 — playback follows the Web Animations timing model, with entry/loop/exit slots
Why: review before building: "mode" and "repeat" are one iteration count, exits are entries in reverse, a free duration breaks seamless loops (A6), and one animation per element can't enter, loop and exit.
- MODIFIED R1@1 → R1@2
- MODIFIED R2@1 → R2@2
- MODIFIED R3@1 → R3@2
- MODIFIED R4@1 → R4@2
- ADDED R6@1
- MODIFIED D2@1 → D2@2
- REMOVED D1@1
- REMOVED D3@1
- ADDED D4@1, D5@1, D6@1, D7@1, D8@1, D9@1
- Tasks: T001–T005 (never started) replaced by T001–T007
