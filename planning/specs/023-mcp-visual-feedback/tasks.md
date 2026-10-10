# 023 — mcp-visual-feedback — Tasks

- [ ] T001 [agent] [status:todo] Pure `inspectLayout`: text overlaps, out-of-canvas boxes, attachments to missing ids, at given times
      covers: D1@1
- [ ] T002 [agent] [status:todo] `scene_inspect_layout` tool
      covers: D2@1, A20@2
- [ ] T003 [agent] [status:todo] Pure `color.ts`: parse, composite, WCAG luminance and ratio, OKLCH lightness suggestion
      covers: D3@1
- [ ] T004 [agent] [status:todo] Pure `contrast.ts`: backdrop under a text box, opacity, gradients, `unverifiable` cases
      covers: D4@1
- [ ] T005 [agent] [status:todo] Contrast in `inspectLayout` per time, text stroke, diagnostic fields
      covers: D5@1, D6@1
- [ ] T006 [agent] [status:todo] Test: each layout diagnostic on a fixture scene; an element entering from outside is flagged only at the times it is outside; the tool is listed by the CLI and MCP
      covers: R2@2, R3@2
      kind: test
- [ ] T007 [agent] [status:todo] Test: WCAG ratios against known pairs; normal and large thresholds; text on a card on a contrasting background; opacity; gradient worst point; image backdrop unverifiable; stroke; fade-in reported only when unreadable; suggestion meets the threshold
      covers: R5@1, R6@1, R7@1, R8@1, R9@1, R10@1, R11@1
      kind: test
