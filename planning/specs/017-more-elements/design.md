# 017 — more-elements — Design

## Approach

- D1@1 (implements R1–R11): Each component is a descriptor folder in `src/components/<kind>/` composing the shared field groups; no component needs code outside its folder (A23).
- D2@1 (implements R3, R4, R5, R8, R9, R10): Values that animate (progress value, counter value, typed characters, revealed rows, active step, chart progress) are ordinary numeric fields declared animatable, so preset animations (013/018) and keyframes (015) drive them.
- D3@1 (implements R5): Highlighting uses a small MIT tokenizer (e.g. Prism-style grammars) run once per code change and cached; drawing stays Canvas 2D.
- D4@1 (implements R7): The window mockup is a container like a group: children in its own content space, clipped to the window body.
- D5@1 (implements R11): Paths are stored as SVG `d` strings and drawn with `Path2D`; morph interpolates paths resampled to the same point count.
- D6@1 (implements R12): Blur, blend and mask are a shared `effects` field group applied by the renderer around any component's draw, not by each component.
- D7@1 (implements R13): Presets are recipes (A19) in `presets/built-in/`.

## Deliverables

One descriptor folder per new component, the `effects` field group, presets.

## Sequencing

Simple shapes → badge → progress → counter → bubble → steps → list/table → code →
window → charts → path → effects → presets → tests.
