# 023 — mcp-visual-feedback — Tasks

- [x] T001 [agent] [status:done] Pure `inspectLayout`: text overlaps, out-of-canvas boxes, attachments to missing ids, at given times
      covers: D1@2
      └─ reviewed 2026-10-22: the diagnostics still hold; boxes are added beside them by T008
      changes: src/service/layout.test.ts (+127 -0), src/service/layout.ts (+210 -0)
- [x] T002 [agent] [status:done] `scene_inspect_layout` tool
      covers: D2@1, A20@2
      changes: src/service/service.test.ts (+17 -0), src/service/tools/index.ts (+2 -0), src/service/tools/scene-inspect-layout.ts (+56 -0)
- [x] T003 [agent] [status:done] Pure `color.ts`: parse, composite, WCAG luminance and ratio, OKLCH lightness suggestion
      covers: D3@1
      changes: src/engine/color.test.ts (+67 -0), src/engine/color.ts (+293 -0)
- [x] T004 [agent] [status:done] Pure `contrast.ts`: backdrop under a text box, opacity, gradients, `unverifiable` cases
      covers: D4@1
      changes: src/service/contrast.test.ts (+98 -0), src/service/contrast.ts (+174 -0)
- [x] T005 [agent] [status:done] Contrast in `inspectLayout` per time, text stroke, diagnostic fields
      covers: D5@1, D6@1
      changes: src/service/layout.ts (+149 -6)
- [x] T006 [agent] [status:done] Test: each layout diagnostic on a fixture scene; an element entering from outside is flagged only at the times it is outside; the tool is listed by the CLI and MCP
      covers: R2@3, R3@2
      └─ reviewed 2026-10-22: its diagnostic checks still hold; the returned boxes are tested by T009
      kind: test
      changes: src/service/layout.test.ts (+9 -2)
- [x] T007 [agent] [status:done] Test: WCAG ratios against known pairs; normal and large thresholds; text on a card on a contrasting background; opacity; gradient worst point; image backdrop unverifiable; stroke; fade-in reported only when unreadable; suggestion meets the threshold
      covers: R5@1, R6@1, R7@1, R8@1, R9@1, R10@1, R11@1
      kind: test
      changes: src/service/contrast.test.ts (+217 -42)
- [x] T008 [agent] [status:done] Pure `layoutBoxes(scene, times)` in `layout.ts`; `scene_inspect_layout` returns its boxes beside the diagnostics
      covers: D1@2
      changes: src/service/layout.ts (+17 -0), src/service/tools/scene-inspect-layout.ts (+18 -4)
- [x] T009 [agent] [status:done] Test: a centred element's box has its centre on the canvas centre; an element entering from outside has a different box at each time; the tool returns the boxes
      covers: R2@3
      kind: test
      changes: src/service/layout.test.ts (+42 -1), src/service/service.test.ts (+16 -0)
