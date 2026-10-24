# 057 — path-layers-and-particles — Design

## Approach

- D1@1 (implements R1, R4): Add `mode: select(["morph", "layers"], "morph")` to the `path` fields (`src/components/path/descriptor.ts`, section "Trazado", shown only when `shapes.length > 1`). `morph` and `morphEasing` become visible only in `"morph"` mode. The zod default fills `"morph"` for scenes saved before 057, so they parse and draw unchanged.
- D2@1 (implements R1): In `src/components/path/draw.ts`, extract the body of `drawPath` after `frameOf` (shadow → fill → stroke + glow) into a private `paintFrame(ctx, el, frame, shown, st, scene, t)` helper. `drawPath` then picks the frames: `"morph"` gives `[frameOf(el)]` as today, and `"layers"` gives `el.shapes.map((_, i) => shapeFrame(el, i))`, skipping shapes that fail to parse. Each frame is painted in list order inside a single `withTransform`. `styleOf` already falls back from per-shape `fill`/`stroke` to the element's, so R1's fallback works without new code. All layers share the view box mapping, so they stack in the same element box.
- D3@1 (implements R2, R4): In `src/components/particles/descriptor.ts`:
  - `speed` becomes `num(1, { min: 0, max: 6, step: 0.1, bounds: [0, Infinity] })`, with `int` dropped.
  - New `motion: select(["drift", "fall", "static"], "drift")`.
  - New `direction: num(90, { max: 360, bounds: [0, 360] })`, visible only in `"fall"`. 0° = right, 90° = down, matching canvas y-down.
  - New `gravity: num(0, { max: 4, step: 0.1, bounds: [0, Infinity] })`, visible only in `"fall"`.
  - New `twinkle: num(0, { max: 1, step: 0.05, bounds: [0, 1] })`.

  All of them have defaults, so older scenes parse to the same values they had before.
- D4@1 (implements R3, R4): `particlePositions` in `src/engine/particle-field.ts` stays the single entry point and switches on `motion`:
  - **drift**: the current orbit code. It keeps the same PRNG call order and the same `fx = 1 + floor(rand * speed)`, so integer speeds give the same points bit for bit (R4). For `0 < speed < 1`, frequencies stay at 1 and amplitudes are scaled by `speed`, so loops still close (A6). `speed === 0` returns the resting places.
  - **static**: returns the orbits' resting places `(bx, by)`. These are the same seeded positions drift moves around.
  - **fall**: delegates to a new pure module.
- D5@1 (implements R3): New pure module `src/engine/particle-fall.ts` exposing `fallPositions(el, t, duration)`:
  - The math works in a frame rotated to `direction`. Every point gets a seeded lane `v` across that direction and a phase `u0` along it, both inside a square of side `D = hypot(w, h)` centred on the box. That square covers the box at any angle.
  - Each point makes `k_i` whole crossings of `D` per loop. `k_i` is `floor(speed)` or `ceil(speed)`, chosen by the seed so that the field's mean is `speed`, with a minimum of 1. Because `k_i` is a whole number, the point is back at its start after one loop (A6).
  - Gravity shapes each crossing as `s(τ) = D·((1−a)·τ + a·τ²)` with `a = gravity / (1 + gravity)`. The curve rises monotonically, starts slow and speeds up, and `s(1) = D`. Each wrap therefore starts a fresh "drop", and the loop stays seamless.
  - Points are mapped back to box coordinates. Points outside the box, plus a margin of the largest sprite size, are returned as `NaN` so the draw step skips them.
  - The module has its own PRNG stream (`seed * 6007`), so drift orbits and looks are never disturbed.
- D6@1 (implements R2, R3): New pure function `twinkleAlphas(el, t, duration): Float64Array | null` in `src/engine/particle-twinkle.ts`. It returns `null` when `twinkle === 0`, which keeps the fast path unchanged. Otherwise each point's opacity factor is `1 − twinkle · (0.5 − 0.5·cos(f_i·phase + p_i))`, where `f_i ∈ {1, 2, 3}` is a whole number (A6) and `p_i` comes from the seed. Twinkle works in all three motion modes, including `"static"`.
- D7@1 (implements R2, R3): In `src/components/particles/draw.ts`:
  - Points whose coordinates are `NaN` are skipped for both dots and links.
  - The sprite path multiplies `looks.alpha[i]` by the twinkle factor.
  - The plain-dot path buckets dots by quantised alpha into `ALPHA_STEPS` `Path2D`s, the same way links are bucketed today.
  - The bucketing loop is extracted into a local `bucketBy(alpha, add)` helper that links and dots share (DRY).
  - When twinkle is off, dots still go through the single-path branch, so they render identically (R4).

## Trade-offs & Mitigations

### 1. `mode` on `path` vs. a new `layers` component
- **Pro**: One new field. It reuses parsing, the view box, styles, the inspector shape list and the "draw" entrance. There's no new component kind to register, expand or inspect (KISS).
- **Con**: `morph` and `morphEasing` don't do anything in `"layers"` mode, and someone can still keyframe them.
- **Mitigation**: Both fields are hidden in `"layers"` mode through `visible`. A test checks that a `morph` value set in layers mode doesn't change the drawn output.

### 2. Whole crossings per loop for `fall` vs. free-running speed
- **Pro**: Exported GIF/MP4 loops stay seamless (A6). The behaviour is deterministic and stateless: a pure function of `t`, with no simulation.
- **Con**: Each point's speed is quantised to whole crossings per loop, and `speed < 1` can't be slower than 1 crossing per loop.
- **Mitigation**: Spreading `k_i` between floor and ceil keeps the field's mean speed equal to `speed`. The inspector and the MCP field docs say that in `"fall"` mode `speed` means "crossings per loop" with an effective minimum of 1. Slow, sparse drifting is still possible with a longer scene `duration`.

### 3. Gravity as per-crossing easing vs. real acceleration
- **Pro**: Points start slow and accelerate, which looks like falling. It stays closed-form and loop-safe.
- **Con**: Velocity resets at each wrap. That isn't physical, but the wrap happens outside the visible box, in the margin of the `D` square.
- **Mitigation**: The `D` square always reaches past the box, so the reset is never on screen. `a < 1` keeps `s` strictly increasing, so a point never stops or reverses.

### 4. Rotated `D`-square wrap vs. wrapping modulo `w`/`h`
- **Pro**: It's seamless at any `direction`. Wrapping modulo `w` and `h` only closes the loop when the displacement is a multiple of both, which a diagonal direction breaks.
- **Con**: Some points spend part of the loop outside the box, so fewer points are visible than `count`, by up to about 50% at 45° on a wide box.
- **Mitigation**: The off-box points are culled before links are computed, so they cost nothing. The docs say diagonal falls may need a higher `count`.

### 5. Twinkle via alpha buckets vs. one sprite per point
- **Pro**: Twinkle costs `ALPHA_STEPS` fills per frame instead of `count` draws. It reuses the link bucketing approach.
- **Con**: Opacity is quantised to 16 levels.
- **Mitigation**: 16 levels is already accepted for links. Points on the sprite path get exact per-point alpha.

### 6. Research
- tsParticles uses the same knobs: `move.direction`, `move.gravity`, `move.outModes: "out"` for wrapping, and `twinkle`. Those names and their meanings are familiar to authors.
- Unlike tsParticles, lienzo can't simulate step by step: frames are a function of `t` (A6). Closed-form, seed-driven motion is the established approach for seamless loops.

## Deliverables

- `src/components/path/descriptor.ts`: `mode` field; `morph` and `morphEasing` visibility.
- `src/components/path/draw.ts`: extracted `paintFrame`; frame selection for `"layers"`.
- `src/components/particles/descriptor.ts`: fractional `speed >= 0`, `motion`, `direction`, `gravity`, `twinkle`.
- `src/engine/particle-field.ts`: dispatch on `motion`; `static`; `speed < 1` and `speed === 0` handling in drift.
- `src/engine/particle-fall.ts`: pure `fallPositions`.
- `src/engine/prng.ts`: `mulberry32`, moved out of `particle-field.ts` (and re-exported there) so the field, fall and twinkle modules share it without importing each other.
- `src/components/fields/field.ts`: `defaulted(field)`, which gives a field's schema its default so scenes saved before the field existed parse unchanged (R4). It's used by the five 057 fields and by `elementOpacity` and `variation`, which did the same thing inline.
- `src/engine/particle-twinkle.ts`: pure `twinkleAlphas`.
- `src/components/particles/draw.ts`: NaN culling, twinkle alpha, shared `bucketBy`.
- Docs for the new fields where the component fields are described to the MCP tools and agents.
- Tests in `src/engine/` and `src/components/` mirroring the sources.
