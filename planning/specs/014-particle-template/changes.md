# 014 — particle-template — Changes

## 2026-10-10 — sprite-cached templates, defined variation, no isolated edit mode
Why: review before building: 300 `drawElements` calls per frame can't hold the scene fps (R5), "color shift" was undefined, the template needed rules (no recursion, still, local ids), and an isolated editor mode is the costliest and most fragile part for little gain.
- MODIFIED R1@1 → R1@2
- MODIFIED R2@1 → R2@2
- MODIFIED R3@1 → R3@2
- MODIFIED D1@1 → D1@2
- MODIFIED D2@1 → D2@2
- REMOVED D3@1
- ADDED D5@1, D6@1, D7@1
- Tasks: T001–T007 (never started) replaced by new T001–T007
- Setting a template from the CLI/MCP is left to 007, which builds after this spec.

## 2026-10-10 — "Usar como partícula" lives in the inspector
Why: the editor has no context menu, and building one for a single action goes against KISS; the multi-selection inspector already holds the actions on several elements.
- REMOVED D6@1
- ADDED D8@1
- Tasks: T004 re-pointed to D8@1 (still valid)
