# 054 — text-measurement-and-box — Design

## Approach

- D1@1 (implements R1): A pure text measurement module (`src/engine/text-measure.ts`) defines `measureTextWidth(text, style, fontData?)` and `measureFontMetrics(style, fontData?)` behind a cohesive interface (Principle 4 — anti-corruption layer). In browser runtimes (`typeof OffscreenCanvas !== "undefined"`), it delegates to an `OffscreenCanvasRenderingContext2D` instance configured with `font` and `letterSpacing` _(standard: W3C HTML Living Standard `CanvasRenderingContext2D.measureText` — https://html.spec.whatwg.org/multipage/canvas.html#textmetrics)_. In Node environments, it uses `opentype.js` glyph metric tables (`font.charToGlyph(ch).advanceWidth` + `font.getKerningValue` scaled by `size / unitsPerEm`, plus `letterSpacing`) with a lightweight LRU cache over parsed bundled fonts (`@fontsource/*` in `node_modules` or `public/fonts/`) and project user fonts (`src/service/font-store.ts`), falling back gracefully to proportional typographic ratios if font bytes are not yet loaded, guaranteeing calculated widths and heights match rendered canvas dimensions within 10% across font sizes and weights.
- D2@1 (implements R2): The `text` element descriptor (`src/components/text/descriptor.ts`) adds an optional width field `w?: number` using `num(0, { label: "Ancho", section: "Texto", min: 0, max: 4000, step: 10, default: undefined })` (or optional number field) with schema `.optional()`. When `w` is defined and `> 0`, `textLayout` in `src/engine/geometry.ts` performs greedy word-boundary line wrapping within `w`: consecutive words in each paragraph that fit into `w` are kept on the same line, wrapping to the next line at space boundaries (and breaking unbreakable tokens longer than `w` cleanly). The resulting box width is exactly `w` (or the wrapped text's maximum line width clamped to `w`), and in `drawText` (`src/components/text/draw.ts`), lines are horizontally aligned (`left`, `center`, `right`) relative to the box bounds `[el.x, el.x + w]` _(standard: CSS Text Module Level 3 line breaking and alignment — https://www.w3.org/TR/css-text-3/#line-breaking)_.
- D3@1 (implements R2, R3): When `w` is omitted or undefined on a `text` element, `textLayout` retains its existing behavior: splitting solely on explicit newlines (`\n`), computing `w` as `Math.max(1, ...widths)`, and aligning relative to that natural text width, ensuring 100% backward compatibility with all scenes, presets, and tests saved before 054. Compact scenes (`src/service/compact/layout.ts`) placing `text` elements with `at` (such as `at: "center"` or `at: "top-right"`) compute anchor positions using the measured bounding box from D1 (when `w` is omitted) or the explicit box width `w` (when `w` is set).
- D4@1 (implements R4): `boxOf(el)` (`src/engine/geometry.ts`), `placedElementsAt` (`src/service/layout.ts`), and `scene_inspect_layout` (`src/service/tools/scene-inspect-layout.ts`) use the wrapped box dimensions (`w = el.w`, `h = layout.h`) when `w` is set on a `text` element, and the real glyph metrics when `w` is omitted. Spatial diagnostic checks (bounds, overlaps, contrast) and returned layout `boxes` reflect the exact wrapping bounds.

## Deliverables

- `src/engine/text-measure.ts`: pure measurement abstraction and metric providers (browser canvas + Node opentype.js font loader & cache).
- `src/engine/geometry.ts`: integrate text measurement and word-wrap algorithm into `textLayout` and `boxOf`.
- `src/components/text/descriptor.ts`: add optional `w` field to `text` component fields and sections.
- `src/components/text/draw.ts`: draw wrapped lines aligned inside `[el.x, el.x + (el.w ?? layout.w)]`.
- `src/service/compact/layout.ts` & `src/service/layout.ts`: layout boxes and `at` placement with real font metrics and wrapped text boxes.
- `schemas/compact-scene.json`: update JSON schema for compact scenes with `w` on `text`.
- `src/engine/text-measure.test.ts`: unit tests for browser/node glyph metrics, accuracy within 10%, kerning, and fallbacks.
- `src/engine/text-wrap.test.ts`: unit tests for word wrapping, alignment inside `w`, line-breaking edge cases, and omit-`w` backward compatibility.
- `src/service/text-layout.test.ts`: integration tests for `scene_inspect_layout` and compact `at` anchor positioning.

## Sequencing

- D1 (pure `text-measure.ts` module with Node opentype metric calculations) → D2 (word wrapping & optional `w` in `geometry.ts` and `text/descriptor.ts`) → D3 (drawing aligned wrapped text in `text/draw.ts` + compact anchor positioning in `compact/layout.ts`) → D4 (integration in `layout.ts` and `scene_inspect_layout`) → schema updates & tests.

## Trade-offs

- Direct canvas/opentype font metrics behind a unified service interface vs spawning headless browser instances on every text measurement (D1).
  - Pros: In-process calculation executes synchronously in microseconds (<1ms) without the multi-second latency or resource overhead of Playwright browsers (Principles 1, 5 — KISS, pure functions).
  - Cons: Requires loading font byte buffers in Node for `@fontsource` bundled fonts and project user fonts.
  - Mitigation: Cache parsed `opentype.Font` instances in a map by family and weight; provide a robust fallback when font files are not on disk (Principles 4, 10).
- Greedy word-boundary wrapping vs Knuth-Plass dynamic programming breaking (D2).
  - Pros: Simple, fast, deterministic, and matches standard HTML/Canvas CSS `white-space: pre-wrap; word-break: normal` behavior expected in visual canvas editors (Principles 1, 8).
  - Cons: Does not optimize hyphenation or global raggedness across entire paragraphs.
  - Mitigation: For social post graphics and card text, word-level wrapping is the standard canvas pattern and keeps layout instantaneous.
- Optional `w?: number` on `text` elements vs mandatory default `w` (D2, D3).
  - Pros: Retains full backward compatibility with all historical scenes, preset recipes (`presets/built-in/*.json`), and tests where text width flows from string length (Principles 1, KISS/YAGNI).
  - Cons: Layout calculations must branch on whether `el.w` is defined and positive.
  - Mitigation: `textLayout` encapsulates the check in a single place (`const wrapW = el.w && el.w > 0 ? el.w : undefined`), returning canonical `{ lines, widths, w, h, lineStep }` for all consumers (draw, boxOf, layout).
