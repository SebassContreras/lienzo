# 053 — transform-origin-and-opacity — Requirements

Rotations (`@rotate`), scaling (`@scale`) and loop animations (`swing`, `wobble`, etc.) always pivot around the element's center (`{0.5, 0.5}`), detaching hinged elements like tree crowns or limbs from their anchor unless the bounding box is artificially padded. Additionally, `group`, `rect` and `ellipse` lack a unified element-level `opacity` field.

- R1@1: Every element supports an optional `origin: { x: number; y: number }` field in box fractions (`0` to `1`, default `{ x: 0.5, y: 0.5 }`), around which `@rotate`, `@scale` and preset/loop transforms pivot in `animate(el, t, scene)` and `withTransform`.
- R2@1: Compact scenes accept `origin` either as `{ x, y }`, `[x, y]`, or a named anchor (`"center"`, `"top"`, `"bottom"`, `"left"`, `"right"`, `"top-left"`, `"top-right"`, `"bottom-left"`, `"bottom-right"`), expanding to `{ x, y }` fractions.
- R3@1: Every registered component kind (including `group`, `rect` and `ellipse`) has a common, animatable `opacity` field (`0` to `1`, default `1`) exposed in the schema, compact format, keyframe tracks and inspector.
- R4@1: During rendering, an element's effective opacity is the product of its own `opacity`, its animation transform opacity, and its ancestor groups' effective opacities; an element or group with effective opacity `0` draws nothing (including its fill, stroke, label and children).
- R5@1: Existing scenes without `origin` or `opacity` render identically to before 053.
