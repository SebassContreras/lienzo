# 023 — mcp-visual-feedback — Changes

## 2026-10-10 — layout inspection only, no second preview
Why: `scene_preview` already exists in 010 (R2), and an offscreen-canvas fallback would be a second drawing path against A3; boxes taken only at t=0 would flag elements that animate in from outside.
- REMOVED R1@1 (→ 010/R2), R4@1
- MODIFIED R2@1 → R2@2, R3@1 → R3@2
- Tasks: none yet (design closed in the same review)

## 2026-10-10 — contrast against the real backdrop, expanded
Why: user decision: agents must not produce unreadable posts; contrast is measured against what is drawn under the text, with WCAG 2.2 AA thresholds, and says `unverifiable` instead of guessing.
- ADDED R5@1–R11@1, D3@1–D6@1
- Tasks: T003 renumbered T006; ADDED T003–T005, T007
