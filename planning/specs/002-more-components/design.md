# 002 — more-components — Design

## Approach

- D1@1 (implements R1): `EllipseEl` reuses the rectangle's fill, border, glow, shadow, label and anim fields; `src/components/ellipse.ts` draws it with `ellipse()`; line attachment clips to the ellipse instead of its box.
- D2@1 (implements R2): `IconEl` stores the lucide icon name; `src/components/icon.ts` builds a `Path2D` per node from the `lucide` package's icon node data (path, circle, rect, line, polyline, polygon) scaled from its 24×24 grid; the inspector picker filters icon names by text.
- D3@1 (implements R3): The dev-server middleware gains `POST /api/assets` (writes the uploaded file into `assets/` under a content-hash name) and serves `assets/`; `ImageEl` stores that path and draws a decoded `ImageBitmap` cached per path, clipped to its rounded rect; export awaits image decoding before the first frame.
- D4@1 (implements R4): `GroupEl` holds child elements in its own coordinate space with `x`, `y`, `w`, `h`; drawing translates and scales into it and applies the group's animation; selection becomes a set of ids, with a rubber-band box on empty-canvas drag; group/ungroup are Ctrl+G / Ctrl+Shift+G; attachment lookup searches inside groups and maps child boxes to scene coordinates.
- D5@1 (implements R5): A preset's `element` may be a `GroupEl`; dropping it clones the whole tree with fresh ids.
- D6@2 (implements R6): The new built-in presets are JSON recipes in `presets/built-in/` (004), with the traits they need.

## Deliverables

`src/components/{ellipse,icon,image,group}.ts`, model and inspector additions, `assets/`
middleware, multi-select in `src/editor/stage.tsx`.

## Sequencing

Ellipse → icon → image → multi-select → groups → group presets → built-in presets.
