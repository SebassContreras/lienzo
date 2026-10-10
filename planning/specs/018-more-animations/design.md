# 018 — more-animations — Design

## Approach

- ~~D1@1 (implements R1, R2, R3, R6): Animations become a registry in `src/animations/`, one file per animation, each a pure function of progress returning a transform delta (offset, scale, rotation, skew, opacity, glow); `animate` looks them up (A24).~~ retired 2026-10-10 → D6
- ~~D2@1 (implements R4): Text animations act on per-glyph state computed by the text descriptor's layout, so any component with text (text, label, bubble, code) can use them.~~ retired 2026-10-10 → D8
- ~~D3@1 (implements R5): Stagger is a field on the `anim` group read by `animate` when drawing a container's children.~~ retired 2026-10-10 → D9
- ~~D4@1 (implements R7): New easings are added to `src/engine/easing.ts`.~~ retired 2026-10-10
- ~~D5@1 (implements R8): The animation picker renders a small looping preview with the same `animate` function.~~ retired 2026-10-10 → D10
- D6@1 (implements R1, R2, R3, R10): The kinds move out of `src/engine/anim.ts` into a registry in `src/animations/`, one file per family (`attention.ts`, `motion.ts`, `emphasis.ts`) plus `index.ts`; each kind is a pure function `(p, ease, amount, direction) → Delta`, direction being a parameter rather than one kind per side; exits reuse the entrance at `1 − p` (013/D6), so no exit has code of its own; attention kinds leave the element as it is at `p = 0` and `p = 1` (A6); `anim.ts` keeps only the slot composition; existing kind ids and curves are kept (013/D7).
- D7@1 (implements R1, R2): `AnimState` gains `rotate`, `skewX`, `skewY`, `scaleX` and `scaleY`, and `withTransform` in `src/engine/paint.ts` applies them around the box centre in one fixed order (translate, rotate, skew, scale), so every component gets them without changes.
- D8@1 (implements R9): `AnimState` gains `reveal` (0–1) and a unit (`char`, `word`, `line`); the text component draws only the revealed part of its string, and typewriter is a reveal by `char` without fade. No per-glyph transform.
- D9@1 (implements R5): `stagger` (seconds) is a field of a group's `anim`; `group/draw.ts` draws child `i` at `t − i·stagger`, so `animate` stays unaware of containers.
- D10@1 (implements R8): The picker draws each animation with `animate` on a sample element; one `requestAnimationFrame` inside the picker plays only the hovered or selected entry and the rest show a still frame; choosing an attention kind fills the `loop` slot, an entrance the `in` slot, an exit the `out` slot.

## Deliverables

`src/animations/` registry by family, extended `AnimState` and `withTransform`, text reveal,
group stagger, picker with previews.
