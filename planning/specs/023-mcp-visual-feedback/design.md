# 023 — mcp-visual-feedback — Design

## Approach

- D1@2 (implements R2): `inspectLayout(scene, times)` in `src/service/layout.ts` is pure: for each time it runs `animate` and `boxOf` (the same pure layers `drawScene` uses, A3/A24) and reports `{ code, elementId, t, message }`; a pure `layoutBoxes(scene, times)` beside it returns `{ id, t, x, y, w, h }` per top-level element from the same placed elements; no rendering, so it runs without a browser.
- D2@1 (implements R3): `src/service/tools/scene-inspect-layout.ts` wraps it as a tool; input is a scene or a saved scene name plus optional times.

- D3@1 (implements R6, R11): `src/engine/color.ts` is pure: parsing, alpha compositing, WCAG relative luminance and contrast ratio, and the lightness search for a suggested colour (in OKLCH, so the hue is kept).
- D4@1 (implements R5, R7, R8): `src/service/contrast.ts` is pure: for a text box it walks the elements drawn before it, keeps those whose box covers it, composites their fills with their effective opacity over the background, takes the worst stop of a gradient over the box, and returns `unverifiable` when an image, particle or 3D element is in the stack.
- D5@1 (implements R9, R10): Contrast runs inside `inspectLayout` on the same animated elements per time; a visible text stroke is measured too and the better ratio kept.
- D6@1 (implements R11): Contrast diagnostics extend the layout diagnostic with `ratio`, `required`, `fg`, `bg` and `suggestion`, so tools and agents read one shape.

## Deliverables

`src/service/layout.ts`, `src/service/contrast.ts`, `src/engine/color.ts`, the `scene_inspect_layout` tool.


## Trade-offs

- **Boxes from a separate pure `layoutBoxes`, not inside `inspectLayout`'s return.**
  - *Pros:* `inspectLayout` keeps its shape and callers; one function, one job (SRP); both share `placedElementsAt`, so no duplicated geometry.
  - *Cons:* the tool animates the scene twice per time.
  - *Mitigation:* `animate` is pure and cheap; scenes hold tens of elements, so the cost is negligible.
- **Only top-level boxes, only at the requested times.**
  - *Pros:* small output; what an agent places is top-level.
  - *Cons:* children of a group are not listed.
  - *Mitigation:* the group's box covers them; diagnostics still check children.
- **Text boxes are measured outside the browser.**
  - *Pros:* no browser needed.
  - *Cons:* Node's measurement can differ by a few pixels from the browser's.
  - *Mitigation:* `scene_preview` shows the real render.
