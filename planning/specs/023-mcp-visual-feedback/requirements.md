# 023 — mcp-visual-feedback — Requirements

## What's being built

A visual feedback and spatial analysis tool in the service layer, exposed through MCP and CLI,
allowing automated AI agents to inspect scene renderings (as base64/data-URL PNG snapshots)
and receive layout diagnostics (bounding box overlaps, elements exceeding canvas bounds, low-contrast text).

## Who it serves

AI agents and automated scripts crafting scenes via MCP that need to "see" and verify layout
correctness before finalizing a post.

## Requirements

- ~~R1@1: A `scene_preview` tool in `src/service/tools/` renders a given scene JSON into a lightweight PNG snapshot (data URL / base64 or temporary asset path) without requiring a full export workflow.~~ retired 2026-10-10 → 010/R2
- R2@3: A `scene_inspect_layout` tool analyses the element boxes at given times (by default the start, middle and end of the loop) and returns diagnostics naming the element and the time: overlapping text, elements outside the canvas, and line ends attached to ids that do not exist; it also returns the box (`id`, `t`, `x`, `y`, `w`, `h`) of every top-level element at each time, so an agent can verify placement.
- R3@2: `scene_inspect_layout` is a registry tool (A20), so the MCP server (009) and the CLI (008) expose it with no change; agents see the picture through 010's `scene_preview`.
- ~~R4@1: Execution utilizes the headless renderer (010) or fast offscreen canvas fallback to guarantee parity with the editor preview (A3).~~ retired 2026-10-10

- R5@1: Every text element is checked for contrast against what is actually drawn under it (the elements below it in draw order whose boxes cover it, over the scene background), so an agent is warned before it makes an unreadable post.
- R6@1: Thresholds follow WCAG 2.2 AA (§1.4.3): 4.5:1 for normal text, 3:1 for large text (at least 24 px, or at least 18.66 px and bold).
- R7@1: The effective colours account for opacity (of the text, of the elements below and of their groups), composited in draw order.
- R8@1: Under a gradient the worst point over the text's box counts; under an image, particles, a 3D element or any backdrop that cannot be reduced to colours, the result is `unverifiable` instead of a guess.
- R9@1: A text stroke counts: when the text has a visible stroke, the better of fill and stroke contrast is used.
- R10@1: Contrast is checked at the same times as the layout (R2), so a text that fades or moves over a different backdrop is reported at the time it is unreadable.
- R11@1: Each contrast diagnostic gives the element, the time, the measured ratio, the required ratio, the two colours, and a suggested text colour (same hue, adjusted lightness) that meets the threshold.

## Dependencies

007.

## Owner split

All tasks agent.
