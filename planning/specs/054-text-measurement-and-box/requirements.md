# 054 — text-measurement-and-box — Requirements

In Node service tools, text width is estimated with a rough heuristic that can be up to 4x smaller than real glyph metrics, placing `at`-anchored text off-center and returning inaccurate boxes in `scene_inspect_layout`. In addition, `text` elements have no box width (`w`), so centering or wrapping multi-line copy requires a transparent `rect` workaround.

- R1@1: Node-side text measurement (`src/service/compact/layout.ts` and `src/service/layout.ts`) computes text width and height from real font glyph metrics (using bundled/installed font tables or the renderer's font metrics) matching actual rendered dimensions within 10% across font sizes and weights.
- R2@1: `text` elements support an optional box width `w` (in pixels); when `w` is set, text wraps automatically at word boundaries within `w` and aligns (`left`, `center`, `right`) inside `[x, x + w]` rather than treating `x` as the left edge of an unbounded line.
- R3@1: When `w` is omitted on a `text` element, behavior remains unchanged from before 054, and `at` placement in compact scenes uses the accurate measured width and height from R1.
- R4@1: `scene_inspect_layout` and compact `at` positioning use the wrapped box dimensions when `w` is set on a `text` element and the real glyph metrics when `w` is omitted.
