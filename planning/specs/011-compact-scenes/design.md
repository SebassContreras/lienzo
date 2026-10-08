# 011 — compact-scenes — Design

## Approach

- D1@1 (implements R1, R2, R5, R7, R8): The compact schema is derived from the descriptor registry (every field optional, plus `preset`, `at`, `fit`, `from`, `to` and short tracks); its JSON Schema is written to `schemas/compact-scene.json`.
- D2@1 (implements R1, R2): `expandScene` builds each element with `resolvePreset` or the descriptor defaults and deep-merges the given fields.
- D3@1 (implements R3): Anchors and `fit` are resolved after building, from `boxOf` and the scene size.
- D4@1 (implements R4): Readable ids stay as element ids (checked unique); `from` / `to` become line attachments.
- D5@1 (implements R6): `scene.build` is a service tool (A20); the result goes through the scene schema before any write.

## Deliverables

`src/model/compact.ts`, `src/service/compact/expand.ts`, `scene.build` tool,
`schemas/compact-scene.json`, README example.
