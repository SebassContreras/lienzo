# 059 — shapes-clip-and-gradients — Requirements

Regular polygons (`sides: 3`) are inscribed in a circle so their base sits at ~75% of the element box height (causing roofs to float above houses), `group` elements only clip children when a visible device/window `frame` is active, and shape fills only support 2-stop linear gradients.

- R1@1: The `polygon` component (`src/components/polygon/`) supports `fit: "circle" | "box"` (default `"circle"`); when `fit: "box"` is set, the polygon's vertices are scaled to span the full `0..w` and `0..h` bounding box.
- R2@1: The `group` component (`src/components/group/`) supports a boolean `clip` field (default `false`); when `clip: true` is set, children are clipped to the group's `w × h` rectangle (rounded by `radius`, if set) even when `frame` is `"none"`.
- R3@1: The shared `fill` field group (`src/components/fields/fill.ts` and `src/engine/paint.ts`) supports `type: "linear" | "radial"` (default `"linear"`) and an optional `stops: Array<{ at: number; color: string }>` (`0 <= at <= 1`, sorted or applied in order) in both full and compact formats, falling back to the 2-color `color` / `colorTo` gradient when `stops` is omitted.
- R4@1: Existing `polygon`, `group`, and gradient-filled elements without the new fields render identically to before 059.
