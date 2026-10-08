# 015 — keyframes-timeline — Design

## Approach

- D1@1 (implements R1, R3): `el.tracks: { [propertyPath]: Keyframe[] }`; descriptors declare the animatable paths (A23).
- D2@1 (implements R2, R6): `animate` evaluates tracks first (with `src/engine/easing.ts`), then preset animations (A24).
- D3@1 (implements R4, R5): The timeline panel lives in `src/editor/timeline/`, separate from the stage and the inspector; the inspector writes to the keyframe under the playhead.
- D4@1 (implements R7): The example is a scene file in `scenes/examples/`.

## Deliverables

Track model, evaluation, timeline panel, inspector hook, example scene.
