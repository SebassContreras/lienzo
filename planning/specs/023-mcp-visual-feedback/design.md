# 023 — mcp-visual-feedback — Design

## Approach

- D1@1 (implements R2): `inspectLayout(scene, times)` in `src/service/layout.ts` is pure: for each time it runs `animate` and `boxOf` (the same pure layers `drawScene` uses, A3/A24) and reports `{ code, elementId, t, message }`; no rendering, so it runs without a browser.
- D2@1 (implements R3): `src/service/tools/scene-inspect-layout.ts` wraps it as a tool; input is a scene or a saved scene name plus optional times.

- D3@1 (implements R6, R11): `src/engine/color.ts` is pure: parsing, alpha compositing, WCAG relative luminance and contrast ratio, and the lightness search for a suggested colour (in OKLCH, so the hue is kept).
- D4@1 (implements R5, R7, R8): `src/service/contrast.ts` is pure: for a text box it walks the elements drawn before it, keeps those whose box covers it, composites their fills with their effective opacity over the background, takes the worst stop of a gradient over the box, and returns `unverifiable` when an image, particle or 3D element is in the stack.
- D5@1 (implements R9, R10): Contrast runs inside `inspectLayout` on the same animated elements per time; a visible text stroke is measured too and the better ratio kept.
- D6@1 (implements R11): Contrast diagnostics extend the layout diagnostic with `ratio`, `required`, `fg`, `bg` and `suggestion`, so tools and agents read one shape.

## Deliverables

`src/service/layout.ts`, `src/service/contrast.ts`, `src/engine/color.ts`, the `scene_inspect_layout` tool.

