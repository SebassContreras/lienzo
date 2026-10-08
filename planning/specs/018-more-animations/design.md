# 018 — more-animations — Design

## Approach

- D1@1 (implements R1, R2, R3, R6): Animations become a registry in `src/animations/`, one file per animation, each a pure function of progress returning a transform delta (offset, scale, rotation, skew, opacity, glow); `animate` looks them up (A24).
- D2@1 (implements R4): Text animations act on per-glyph state computed by the text descriptor's layout, so any component with text (text, label, bubble, code) can use them.
- D3@1 (implements R5): Stagger is a field on the `anim` group read by `animate` when drawing a container's children.
- D4@1 (implements R7): New easings are added to `src/engine/easing.ts`.
- D5@1 (implements R8): The animation picker renders a small looping preview with the same `animate` function.

## Deliverables

`src/animations/`, easing additions, text glyph state, picker with previews.
