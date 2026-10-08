# 012 — component-registry — Design

## Approach

- D1@1 (implements R1, R4, R5): `src/components/<kind>/descriptor.ts` and `draw.ts` per kind; field groups in `src/components/fields/`; the registry in `src/components/index.ts`.
- D2@1 (implements R2): The Zod schema in `src/model/schema.ts` is built from the descriptor fields and the element types are inferred from it, replacing the hand-written types in `src/model/model.ts`.
- D3@1 (implements R3): A generic `FieldEditor` renders by field type (number, color, select, check, text, custom) and replaces the hand-written per-kind inspectors in `src/editor/inspector.tsx`, keeping the same controls and labels.
- D4@1 (implements R6): `animate(el, t, scene)` in `src/engine/animate.ts` resolves the current `anim` into a transform; `drawElements` calls it and passes the result to each component's draw (A24).

## Deliverables

Descriptors and draw files per kind, field groups, registry, generated schema and inspector,
`src/engine/animate.ts`, updated "To add a component" in AGENTS.md.

## Sequencing

Field groups → descriptor type and registry → descriptors per kind → schema → `animate`
→ inspector → removal of the hand-written inspectors → tests → docs.
