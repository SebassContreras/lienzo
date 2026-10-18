# 039 — codebase-fixes-and-optimization — Design

## Approach

- D1@1 (implements R1): In `src/service/compact/expand.ts`, `normalizeAnim` expands string shorthands into `{ in: { kind } }` or `{ loop: { kind } }` preserving nested structures. In `buildElement`, `anim` is deep-merged onto `element.anim` using `deepMerge` so default durations, easings, loop and out objects remain intact.
- D2@1 (implements R2): In `src/model/compact.ts`, `compactShapeOf` checks for field key `"children"` and provides a recursive `z.lazy(() => z.array(CompactElementSchema))` instead of raw `ElementSchema`. In `expand.ts`, `buildElement` maps over `children` recursively, resolving each with its defaults.
- D3@1 (implements R3): In `src/engine/subtitles/layout.ts`, when computing spacing for words in a cue or line, layout accounts for inter-word clearance so that `highlightScale` (e.g. 1.15) on the active word does not overlap adjacent words.
- D4@1 (implements R4): In `src/service/render-target.ts`, a shared pure helper `resolveAndRenderScene(ctx, options)` unifies scene retrieval and headless renderer invocation for `scene_export` and `scene_preview`.
- D5@1 (implements R5): Extend `Ctx` in `src/service/ctx.ts` with optional `tts?: TtsService`, instantiated with default factory when omitted, and consumed by `scene_generate_speech`.
- D6@1 (implements R6): In `src/mcp/server.ts`, compute `registry.tools.map(mcpToolOf)` once at server creation and serve it directly to `ListToolsRequestSchema`.
- D7@1 (implements R7): Prune unused exports and constants: remove `SAME_T` from `src/engine/tracks.ts`, `HUE_STEPS` from `src/engine/particle-field.ts`, `isWordCompleted` from `src/engine/subtitles/cue-timing.ts`, and obsolete keyframe aliases in `src/model/compact.ts`.
- D8@1 (implements R8): Add an OpenCode & generic stdio client configuration section in `README.md` with exact `command`, `args`, and `cwd` settings.

## Deliverables

- `src/service/compact/expand.ts`, `src/model/compact.ts`
- `src/engine/subtitles/layout.ts`, `src/components/subtitles/draw.ts`
- `src/service/render-target.ts`, `src/service/tools/scene-export.ts`, `src/service/tools/scene-preview.ts`
- `src/service/ctx.ts`, `src/service/tools/scene-generate-speech.ts`
- `src/mcp/server.ts`, `README.md`
- Tests covering anim deep-merge, compact groups, subtitle clearance, and render helpers.

## Trade-offs

- **D1 (Anim deep-merge):**
  - *Pros:* Eliminates fragile animation overrides when agents pass partial properties (like `{ in: "fade" }`).
  - *Cons:* Slightly more complex expansion logic when overriding explicit null/undefined fields.
  - *Mitigation:* Explicitly handle primitives vs nested objects with a pure `deepMerge` helper.
- **D2 (Recursive compact children):**
  - *Pros:* Allows hierarchical group nesting in compact scene format without manual expansion.
  - *Cons:* Zod lazy evaluation can have slight overhead during schema validation.
  - *Mitigation:* Use `z.lazy` only on the recursive children array, preserving direct validation elsewhere.
- **D3 (Karaoke highlight clearance):**
  - *Pros:* Eliminates visual overlap and artifacting between scaled words during playback.
  - *Cons:* Line layout may reserve slightly more horizontal width for cues with high scaling.
  - *Mitigation:* Calculate extra padding proportionally to `(highlightScale - 1)` so unscaled cues are unaffected.
- **D4 (Shared render helper):**
  - *Pros:* Adheres to DRY by centralizing scene resolution, export options, and error handling.
  - *Cons:* Creates a coupling point between `scene_export` and `scene_preview`.
  - *Mitigation:* Keep the helper pure and parameter-driven, returning canonical render buffers.
- **D5 (TtsService in Ctx):**
  - *Pros:* Adheres to Dependency Inversion (DIP) and testability; tests can inject mock TTS providers.
  - *Cons:* Additional optional field on `Ctx`.
  - *Mitigation:* Lazy factory fallback when `ctx.tts` is undefined maintains backwards compatibility.
- **D6 (MCP schema memoization):**
  - *Pros:* Fast O(1) response times on `tools/list` without CPU cycles spent regenerating JSON schemas.
  - *Cons:* Tools cannot be dynamically registered after server startup.
  - *Mitigation:* Tool registry in Lienzo is statically defined at boot; dynamic runtime additions are not used.
- **D7 (Dead code pruning):**
  - *Pros:* Cleaner codebase, reduced bundle size, no misleading unused symbols.
  - *Cons:* Risk of removing symbols that might be accessed dynamically.
  - *Mitigation:* Verified against active usages and maintained necessary parsers (such as WebVTT).
- **D8 (MCP client documentation):**
  - *Pros:* Reduces user friction when configuring MCP in diverse agent clients like OpenCode.
  - *Cons:* Documentation must be maintained if CLI flags change.
  - *Mitigation:* Document standardized stdio invocations matching stable CLI commands.

