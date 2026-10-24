# 059 — shapes-clip-and-gradients — Design

## Approach

- D1@1 (implements R1, R4): `polygon` gets `fit: defaulted(select([["circle", "Círculo"], ["box", "Caja"]], "circle", { label: "Ajuste", section: "Forma" }))`. `defaulted` makes scenes saved before 059 parse as `"circle"`, so they draw exactly as before.
- D2@1 (implements R1): New pure function `fitToBox(pts: Pt[], box: Box): Pt[]` in `src/engine/geometry.ts`. It maps the points' own bounding box onto `box` (`x' = box.x + (x − minX) / (maxX − minX) · box.w`, the same for y), and it leaves a zero-width or zero-height axis centred instead of dividing by zero. `src/components/polygon/draw.ts` exports `polygonPoints(el)`, which returns `radialPoints(el, cornerCount(el.sides))`, passed through `fitToBox` when `fit === "box"`. `drawPolygon` and `outlineOf` in `src/engine/clip.ts` (which is used for masks) both call it, so a box-fitted polygon masks the same way it draws. With `sides: 3`, the base lands on `y + h` and the apex on `y`.
- D3@1 (implements R2, R4): `group` gets two `defaulted` fields in its "Grupo" section: `clip: check(false, { label: "Recortar contenido" })` and `radius: num(0, { label: "Radio", min: 0, visible: (p) => p.clip === true && p.frame === "none" })`. In `drawGroup`, when `frame === "none"`, content is drawn through `withClip` when `clip` is true and drawn directly when it's false (the current path). The clip outline is `roundRect(el.x, el.y, el.w, el.h, min(radius, w/2, h/2))`. It's applied in the group's box space, inside `withTransform` and before the `cw × ch` scale, so it follows the group's animation. When a frame is active, the body clip (017/D4) already applies and `clip` adds nothing.
- D4@1 (implements R3, R4): `fillFields` (`src/components/fields/fill.ts`) gets two `defaulted` fields, both visible only while `gradient` is on:
  - `type: select([["linear", "Lineal"], ["radial", "Radial"]], "linear")`. `angle` is shown only for `linear`.
  - `stops: custom("gradient-stops", undefined, StopsSchema.optional(), { label: "Paradas", inspector: false })`. `StopsSchema = z.array(z.object({ at: z.number().min(0).max(1), color: z.string() })).min(2)`.

  `FillDefaults` gets `type`. Every caller (`rect`/`shapeFields`, `badge`, `path`, `icon` tile) inherits both fields with no code of its own. The second color stays the existing `color2` field. R3's "`colorTo`" names this same field, so no field is renamed and no scene breaks. Compact gets both fields for free: `makeCompactFieldSchema` makes every sub-field of an `obj` optional, so `{ fill: { gradient: true, type: "radial", stops: [...] } }` is valid compact input. `schemas/compact-scene.json` is regenerated.
- D5@1 (implements R3, R4): In `src/engine/paint.ts`:
  - New pure `gradientStops(fill): { at: number; color: string }[]` returns `fill.stops` in the given order when present, and `[{ at: 0, color: fill.color }, { at: 1, color: fill.color2 }]` otherwise.
  - New `fillGradient(ctx, box, fill)` builds a `createLinearGradient` from the existing angle geometry (factored out of `linearGradient`, unchanged) or a `createRadialGradient(cx, cy, 0, cx, cy, hypot(w/2, h/2))` for `radial`. It then calls `addColorStop` for each stop.
  - `linearGradient(ctx, box, angle, c1, c2)` stays as a thin wrapper, because `text`, `progress` and the scene background use it with their own two colors. The four fill callers switch to `fillGradient`. `path` passes `{ ...el.fill, color: style.fill }`, keeping its current first color.
- D6@1 (implements R1, R2, R3): The `scene_build` / `element_add` tool descriptions mention `fit: "box"`, `clip` and `type`/`stops`, so an agent can discover them. No inspector editor is built for `stops` (YAGNI): it's JSON-only for now, and the inspector shows `type`.

## Trade-offs & Mitigations

### 1. Normalize the inscribed points vs. a separate box-polygon formula
- **Pro**: One generic `fitToBox`, reused through `polygonPoints` by both draw and mask, with no per-side-count special cases. `sides: 3` becomes an isosceles triangle whose base sits on the box bottom, which is the roof issue #8 asks for.
- **Con**: Box mode stretches the shape, so the polygon is no longer regular (a box-fitted hexagon's sides differ in length).
- **Mitigation**: That's what "fit to box" means, and it's opt-in. `circle` stays the default and its output is unchanged (R4). A regression test pins circle-mode points.

### 2. `clip` as a boolean on `group` vs. a generic per-element clip
- **Pro**: It solves the actual need (masked content without a window chrome) in a few lines, reusing `withClip`.
- **Con**: Clipping to anything other than a rounded rectangle still needs `effects.mask` (025).
- **Mitigation**: `effects.mask` already covers arbitrary shapes. The tool description points to it.

### 3. Adding `radius` to `group`
- **Pro**: R2 needs rounded clipping, and the group had no radius field.
- **Con**: It's one more field, and it does nothing unless `clip` is on and there's no frame.
- **Mitigation**: It's hidden in the inspector unless it applies (`visible`), and it defaults to 0.

### 4. Radial gradient as a circle reaching the farthest corner vs. a true ellipse
- **Pro**: Canvas `createRadialGradient` only draws circles, and a circle out to the farthest corner matches CSS's default `farthest-corner` extent. It needs no transform tricks.
- **Con**: In a very wide box the color change runs faster across the short side than an elliptical CSS gradient would.
- **Mitigation**: An ellipse would need the context scaled around the fill, which would distort the border stroke drawn later. Defer it until a real scene needs it (YAGNI). The behavior is documented in the tool description.

### 5. Stops taken in the given order vs. sorting them
- **Pro**: Canvas places each stop by its offset, so order matters only for stops at the same offset, where it gives hard edges (stripes). Keeping the author's order keeps that control and needs no code.
- **Con**: Unsorted input is accepted silently.
- **Mitigation**: Out-of-range `at` is rejected by `StopsSchema` (Canvas would throw `IndexSizeError`). `.min(2)` rules out degenerate gradients.

### 6. `stops` JSON-only, with no inspector editor
- **Pro**: It keeps 059 small, and agents and compact JSON are the main authors of scenes like this one.
- **Con**: Editor users can't edit multi-stop gradients by hand.
- **Mitigation**: The `custom` field is registered with a widget name, so an editor can be added later without a schema change. Until then, the inspector keeps editing `color` and `color2`, which are used whenever `stops` is absent.

### 7. Research
- MDN's `addColorStop` throws `IndexSizeError` for an offset outside 0–1, and stops at the same offset keep their insertion order (W3C canvas list discussion).
- MDN's `createRadialGradient` takes two circles, and its radii must be non-negative and finite.
- CSS `radial-gradient` defaults to the `farthest-corner` extent.

## Deliverables

- `src/engine/geometry.ts`: pure `fitToBox`.
- `src/components/polygon/descriptor.ts`, `draw.ts`: `fit`; `polygonPoints`.
- `src/engine/clip.ts`: `outlineOf` uses `polygonPoints`.
- `src/components/group/descriptor.ts`, `draw.ts`: `clip`, `radius`, clip path.
- `src/components/fields/fill.ts`: `type`, `stops`, `StopsSchema`.
- `src/engine/paint.ts`: `gradientStops`, `fillGradient`; `linearGradient` kept as a wrapper.
- `src/components/{rect,badge,path,icon}/draw.ts`: use `fillGradient`.
- Tool descriptions; regenerated `schemas/compact-scene.json`.
- Tests next to their sources: `src/engine/geometry.test.ts`, `src/engine/paint.test.ts`, `src/components/polygon/polygon.test.ts`, `src/components/group/clip.test.ts`, `src/model/compact-schema.test.ts`.
