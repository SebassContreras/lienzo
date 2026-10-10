# 015 — keyframes-timeline — Changes

## 2026-10-10 — one track module, keyframe buttons, a smaller timeline
Why: review before building against SRP, DRY and KISS: rotation and scale are not fields (only transform channels since 018); "hold" and "loop closing" contradicted each other; whole-number fields (017's active step) could not be animated; the inspector had no way to start a track nor a defined value between keyframes; the panel needed scoping; a `scenes/examples/` folder would not be listed.
- MODIFIED R1@1 → R1@2
- MODIFIED R2@1 → R2@2
- MODIFIED R4@1 → R4@2
- MODIFIED R5@1 → R5@2
- ADDED R8@1, R9@1
- REMOVED D1@1, D2@1, D3@1, D4@1
- ADDED D5@1, D6@1, D7@1, D8@1, D9@1
- Tasks: T001–T009 (never started) replaced by new T001–T008
- Rotation stays a channel (`@rotate`); if 021 needs rotation as a property, it becomes a `rotate` field in the box group and `@rotate` tracks move onto it.
