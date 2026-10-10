# 013 — animation-playback — Design

## Approach

- ~~D1@1 (implements R1, R2, R5): The `anim` field group gains `mode`, `duration`, `repeat` and `easing`; `animate` computes a local progress, clamped and held per mode; missing fields mean today's behaviour.~~ retired 2026-10-10 → D4
- D2@2 (implements R2): Easings live in `src/engine/easing.ts`, shared with keyframes (015): named easings plus a `cubic-bezier` solved like the browsers' (Newton–Raphson with a bisection fallback).
- ~~D3@1 (implements R3, R4): Exit animations are new anim kinds in the `anim` field group; loop mode keeps whole cycles per loop.~~ retired 2026-10-10 → D6
- D4@1 (implements R1, R5): The `anim` field group becomes `{ in, loop, out }`; its schema first moves an old flat `{ kind, amount, cycles, delay }` into the slot its kind belongs to.
- D5@1 (implements R2, R3, R4): `src/engine/timing.ts` turns a slot's timing and `t` into its eased progress, following the Web Animations timing model (delay, duration, iterations, direction, fill); each slot fixes its fill (entry both, exit forwards, loop none), and a loop that plays forever is periodic for every `t` (A6).
- D6@1 (implements R3, R4): Each kind is a pure function of progress returning its share of the transform (018 builds its registry on this); `animate` composes the three slots (offsets add, scale, alpha, glow and line progress multiply); an exit runs its kind at `1 − progress`.
- D7@1 (implements R2, R5): Each kind has a default easing (`auto`) equal to the curve it uses today, so old scenes keep their exact motion.
- D8@1 (implements R4): A loop's duration is `scene.duration / cycles` and is not stored or edited.
- D9@1 (implements R6): An inspector widget in the animation section shows the warning.

## Deliverables

`anim` field group with slots and migration, `src/engine/easing.ts`, `src/engine/timing.ts`,
`animState` composed from per-kind functions, inspector controls and warning.
