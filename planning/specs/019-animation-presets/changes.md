# 019 — animation-presets — Changes

## 2026-10-10 — copy only, presets expand on load, relative fields come from descriptors
Why: review before building against SRP, DRY and KISS/YAGNI: linked presets resolved in `animate` would couple the pure time layer (A24) to the preset store and make headless export (010), golden tests and undo (020) depend on the library; a name inside `anim` clashed with its object schema and migration and could not carry tracks; the entry and exit delays are absolute seconds and were not made relative; a fixed list of positional fields would break with 016 and 017; the tools and the compact format do not exist yet.
- MODIFIED R2@1 → R2@2
- MODIFIED R3@1 → R3@2
- MODIFIED R4@1 → R4@2
- MODIFIED R5@1 → R5@2
- MODIFIED R6@1 → R6@2
- MODIFIED R7@1 → R7@2
- MODIFIED R8@1 → R8@2
- REMOVED D1@1, D2@1, D3@1, D4@1, D5@1
- ADDED D6@1, D7@1, D8@1, D9@1, D10@1, D11@1
- Tasks: T001–T008 (never started) replaced by T009–T015
- Follow-ups: 007 takes R7 (tools use animation presets) and 011 takes R9 (compact `animPreset`), both through `expandAnimPresets`. Live linked presets can come back later as a "re-sync" over the stored `animPreset`, with no format change.
