# 062 — editor-scene-controls — Changes

## 2026-10-24 — Symbol-mode inspector, `use.symbol` back to text, camera keyframes
Why: after 062, scene settings edited while a symbol was open were dropped on return,
`component_list` reported `use.symbol` as a select with no options (misleading agents), and
camera keyframes could only be set through `shot_set` or JSON.
- ADDED R6@1, R7@1, R8@1
- ADDED D7@1, D8@1, D9@1
- Tasks: T014–T019

## 2026-10-24 — R7 stated a wrong premise
Why: `component_list` lists only kind, label and animatable paths, so it never showed the
field type; the real defect was the descriptor claiming an empty closed list, and widget names
on select/text fields were not checked.
- REMOVED R7@1 → R9
- ADDED R9@1
- D8@1 now implements R9 (wording of its reason corrected)
- Tasks: T016 re-pointed to R9@1
