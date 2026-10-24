# 052 — track-loops-and-step — Design

## Approach

- D1@1 (implements R1, R3, R5): In `src/model/track.ts`, `TrackRepeatSchema` defines `"none" | "loop" | "pingpong"` and a track entry in `Tracks` (`Record<string, Track>`) is a union `Track = Keyframe[] | { keys: Keyframe[]; repeat?: TrackRepeat; until?: number }` (`until` non-negative) _(judgement, no standard)_. Pure helpers `trackKeys(track)` and `trackEntry(keys, repeat, until)` read and construct tracks: when `repeat` is omitted or `"none"` and `until` is omitted, `trackEntry` returns the bare `Keyframe[]` array so existing scenes and tracks without loop settings stay byte-identical (R5), while tracks with `repeat` (`"loop"` or `"pingpong"`) or `until` serialize as `{ keys, repeat?, until? }`. `CompactTracksSchema` (`src/model/compact.ts`) and `normalizeTracks` (`src/service/compact/tracks.ts`) accept both the compact keyframe array and `{ keys: [...], repeat?: "none" | "loop" | "pingpong", until?: number }`.
- D2@1 (implements R2, R5): In `src/engine/tracks.ts`, pure time-mapping helper `effectiveTrackTime(keys, t, repeat, until)` resolves the lookup timestamp before segment interpolation _(standard: CSS Animations `animation-direction: alternate` / Web Animations API iteration progress — https://www.w3.org/TR/web-animations-1/#calculating-the-transformed-progress)_:
  1. When `until !== undefined && t >= until`, clamp `t = until` first so the track freezes at the exact value it had at `until`.
  2. If `keys.length < 2`, `repeat === undefined`, `repeat === "none"`, or `t <= first.t`, return `t`.
  3. Let `span = last.t - first.t`. If `span <= 0` or `t <= last.t`, return `t`.
  4. Let `elapsed = t - first.t`, `cycle = Math.floor(elapsed / span)` and `rem = elapsed - cycle * span`.
  5. For `"loop"`, return `first.t + rem`. For `"pingpong"`, return `cycle % 2 === 0 ? first.t + rem : last.t - rem`.
  `valueAt(track, t, kind)` accepts any `Track` (or `readonly Keyframe[]`), maps `t` through `effectiveTrackTime`, and runs the existing segment interpolation unchanged (R5). All track readers/editors in `src/engine/tracks.ts`, `src/presets/anim-presets.ts` (shifting `until` alongside keyframe times when capturing/applying presets) and `src/editor/` use `trackKeys` and preserve `repeat`/`until` on edits.
- D3@1 (implements R3): `keyframe_set` (`src/service/tools/keyframe-set.ts`) gains optional `repeat: z.enum(["none", "loop", "pingpong"]).optional()` and `until: z.number().min(0).nullable().optional()` parameters, plus optional `t` and `value` when only updating `repeat`/`until` on an existing track _(judgement, no standard)_. Passing `repeat` sets it (`"none"` clears it); passing `until: number` sets it and `until: null` clears it; omitting either preserves the track's current `repeat`/`until`.
- D4@1 (implements R4, R5): `EASINGS` in `src/engine/easing.ts` adds `step: (x: number) => (x < 1 ? 0 : 1)` and `hold: (x: number) => (x < 1 ? 0 : 1)` _(standard: CSS Easing Functions Level 1 `steps(1, jump-end)` — https://www.w3.org/TR/css-easing-1/#step-easing-functions)_. Because `EASING_NAMES`, `EasingSchema` and `CompactKeyframeSchema` derive from `Object.keys(EASINGS)`, both `"step"` and `"hold"` work automatically in full scenes, compact tuples/objects, `keyframe_set`, and the timeline easing `<select>` in `src/editor/timeline/tracks-panel.tsx`.

## Deliverables

- `src/engine/easing.ts`
- `src/model/track.ts`, `src/model/compact.ts`
- `src/engine/tracks.ts`, `src/presets/anim-presets.ts`
- `src/service/compact/tracks.ts`, `src/service/tools/keyframe-set.ts`, `src/service/tools/keyframe-remove.ts`
- `src/editor/keyframe-controls.tsx`, `src/editor/timeline/tracks-panel.tsx`
- `src/engine/tracks.test.ts`, `src/service/compact/expand.test.ts`, `src/service/service.test.ts`

## Sequencing

- D4 (`easing.ts`) and D1 (`track.ts` model + helpers) first → D2 (`engine/tracks.ts`, `anim-presets.ts`, editor callers) → D1/D3 (`compact.ts`, `service/compact/tracks.ts`, `keyframe-set.ts`) → unit and integration tests.

## Trade-offs

- Union `Track = Keyframe[] | { keys, repeat?, until? }` in canonical `Tracks` vs wrapping every track in `{ keys }` (D1). Pros: 100% backwards-compatible with every existing scene file, fixture, preset and test expecting `el.tracks.x` to be an array when no loop/until is set (R5); zero migration needed (Principle 1 — KISS). Cons: code reading `el.tracks[path]` must call `trackKeys(track)` instead of indexing the array directly. Mitigation: `trackKeys` and `trackEntry` in `src/model/track.ts` centralize unwrapping/wrapping in two 3-line pure functions (Principle 3 — DRY via composition).
- Time-remapping (`effectiveTrackTime`) before segment lookup vs duplicating loop math inside number/color/int interpolation (D2). Pros: single pure function handles `"loop"`, `"pingpong"` and `until` for numbers, colors, ints and custom easings alike (Principles 2, 5 — SRP & pure functions). Cons: at exact cycle boundaries (`elapsed = k * span`), `"loop"` wraps to `first.t` while non-looping holds `last.value`. Mitigation: wrapping to `first.t` at `t > last.t` matches periodic modulo arithmetic `(t - first.t) % span` required by R2, and `until` clamps `t` before modulo so stopping at an exact boundary evaluates at `until`.
- Registering both `step` and `hold` in `EASINGS` vs a separate alias map (D4). Pros: `EASING_NAMES`, `EasingSchema`, `CompactKeyframeSchema` and `easingFn` derive directly from `EASINGS` with zero branching or special cases (Principle 1 — KISS). Cons: both `"step"` and `"hold"` appear in `EASING_NAMES`. Mitigation: both are valid easing names per R4 and share the same one-line pure function.
- Extending `keyframe_set` with optional `repeat` and `until` instead of adding a new `track_set` tool (D3). Pros: keeps the tool surface small and lets agents set a keyframe and configure loop/until in one call or update loop settings on an existing track (Principle 1, R3). Cons: `t` and `value` become optional when `repeat` or `until` is provided on an existing track. Mitigation: input validation clearly requires either (`t` and `value`) or (`repeat` / `until` on an existing track), failing fast with `invalid_input` / `not_found`.
