# 058 — compact-effects-and-defaults — Design

## Approach

- D1@1 (implements R1): Root cause: `effects` is a common element field declared in `src/model/element-schema.ts`, not a descriptor field, so `compactShapeOf` never sees it and zod's default object parsing strips it from every compact element. Fix in `src/model/compact.ts`: add `effects: CompactEffectsSchema.optional()` to `baseSpecialFields`. `CompactEffectsSchema` is a `z.looseObject` of the `effects()` sub-schemas, each made optional. Known keys are type-checked, so a bad `blur` still fails with its exact path (051/D4). Unknown keys pass through, so expansion can report them instead of dropping them silently.
- D2@1 (implements R1): New pure module `src/service/compact/effects.ts` exposing `expandEffects(base, raw, path): { effects: EffectsDefaults; notices: string[] }`:
  - It starts from `base`: the element's current effects (a preset's, if any) or `defaultEffects()`, now exported from `src/components/fields/effects.ts`.
  - It merges the known keys over it and emits one notice per unknown key, e.g. `elements.2.effects: «glow» no es un efecto conocido (hay: blur, blend, mask); se ignoró`.
  - The known-key list is read from the `effects()` field group, so a future effect is accepted without touching this module.

  `buildElement` pulls `effects` out of the overrides, calls `expandEffects`, and assigns the result to `element.effects`.
- D3@1 (implements R1): Expansion gets a notices channel.
  - `expandScene` returns `{ scene, notices }` instead of `Scene`.
  - `buildElement` receives an `ExpandState` (`{ findPreset, defaults, notices }`) and the element's path instead of a bare resolver. Groups, symbols and particle templates therefore report with their full path (`elements.0.children.1.effects`).
  - `scene_build` adds `notices: string[]` to its output: the expansion notices followed by the ones `expandAnimPresets` already produces.
  - Callers of `expandScene` are updated (the tool and `expand.test.ts`).
- D4@1 (implements R2): `CompactSceneSchema` and the generated JSON schema get `defaults: z.enum(["flat"]).optional()`. It's a one-value enum rather than a boolean, so later presets (`"soft"`, …) can extend it without a breaking change.
- D5@1 (implements R2): New pure module `src/service/compact/defaults.ts` with `FLAT_SHAPE_PATCH = { fill: { gradient: false }, shadow: { enabled: false }, border: { width: 0 } }` and `applySceneDefaults(el, defaults)`.
  - It applies the patch only to the kinds built from `shapeFields`: `rect`, `ellipse`, `polygon`, `star` and `arrow` (the `ShapeEl` union).
  - It runs in `buildElement` right after `defaultElement(kind)` and before the element's own overrides are merged, so any value written on the element wins.
  - Border width 0 also hides the border glow, since `drawRect` only draws it inside `border.width > 0`.
  - It isn't applied to elements built from a preset, because a preset is explicit styling.
  - It reaches group children, symbol children and particle templates through `ExpandState`.
- D6@1 (implements R3): `scene_preview` gets `out: z.string().min(1).optional()`. The exports path logic in `scene_export` moves to a shared helper `writeExport(ctx, out, bytes, ext)` in `src/service/exports.ts`, used by both tools, so 046/D2 is enforced in one place. That logic resolves inside `projects/<slug>/exports/`, rejects `..` or absolute escapes with `out_of_project`, forces the real extension, then runs `mkdir` and `writeFile`. Without `out`, `scene_preview` writes nothing and behaves as today.
- D7@1 (implements R3): `ImageResult` (`src/service/image.ts`) gets an optional `file: z.string()`, and `scene_preview` returns `{ image, file }` when it wrote a file.
  - In the CLI, the JSON simply gains `file`.
  - In MCP, `contentOf` sends the image content followed by a text content `{"file": "..."}` when `file` is present. The client gets both the picture and the path; MCP's `CallToolResult.content` is an array of mixed items.

## Trade-offs & Mitigations

### 1. `effects` as a compact special field vs. making it a descriptor field
- **Pro**: It's one line in `baseSpecialFields`, and it mirrors how `element-schema.ts` already treats `effects` as common to every kind. No descriptor or inspector changes (KISS).
- **Con**: The compact schema keeps two sources of truth for element fields (descriptors and special fields), so a future common field could be forgotten the same way.
- **Mitigation**: A test checks that every common key of the canonical element schema (`effects`, `origin`, `w`, `shot`, `tracks`, `animPreset`) is accepted by the compact schema. The next forgotten common field fails that test.

### 2. Loose `effects` object plus notices vs. a strict object that fails
- **Pro**: It matches R1 (report, don't fail). An agent's typo (`blurr`) doesn't sink the whole build, and the notice lists the valid keys.
- **Con**: A misspelled effect builds a scene that looks wrong instead of raising an error.
- **Mitigation**: The notices come back in the `scene_build` result next to the scene, so the caller sees them in the same response. Known keys keep strict type validation.

### 3. `expandScene` returning `{ scene, notices }` vs. a module-level collector
- **Pro**: It stays a pure function, with no hidden state shared across concurrent builds (the MCP server handles several calls per process).
- **Con**: The signature change breaks every caller.
- **Mitigation**: There are only two callers (`scene-build.ts` and `expand.test.ts`), and `pnpm typecheck` flags any that's missed.

### 4. Defaults applied before overrides vs. a post-pass that fills unset fields
- **Pro**: "Explicit wins" follows from the existing `deepMerge` order, with no need to track which fields the author wrote.
- **Con**: The saved scene holds the concrete flat values, not the `defaults: "flat"` flag, so the editor won't remember flat for shapes added later.
- **Mitigation**: That's consistent with compact being a build-time format (011), and the tool description says so. Editor defaults for new shapes are out of scope (YAGNI).

### 5. A fixed list of shape kinds vs. "any element with `fill.gradient`"
- **Pro**: It covers exactly the five kinds R2 means. `text` and `badge`, which also have gradients, aren't silently changed.
- **Con**: A new kind built from `shapeFields` has to be added to the list.
- **Mitigation**: The list (`SHAPE_KINDS`) is exported from `src/components/rect/descriptor.ts`, next to `shapeFields` and `ShapeEl`. A test checks that every registered kind whose fields come from `shapeFields` is in it.

### 6. An extra MCP text content vs. a separate tool or base64 only
- **Pro**: One call returns the picture and the saved path, and clients that read only the image are unaffected.
- **Con**: MCP clients that show only the first content item won't show the path.
- **Mitigation**: The image stays first, since it's what clients need most. The file also lands where `scene_export` puts files, so its path is predictable from `out`.

### 7. Research
- In Zod 4, `z.looseObject` keeps unknown keys (it replaces `.passthrough()`, which `presetOnlySchema` already uses), while plain `z.object` strips them. Plain `z.object` stripping is exactly the mechanism behind the R1 bug.
- MCP's `CallToolResult.content` is a list of `text`, `image` and other items, so returning an image plus a text in one result follows the spec.
- Drawing tools offer flat versus rich styling as a named style preset (Excalidraw's sloppiness and edge styles, tldraw's style defaults) rather than as per-field toggles. A scene-level preset name follows that familiar pattern.

## Deliverables

- `src/model/compact.ts`: `effects` in `baseSpecialFields`; `defaults` in `CompactSceneSchema` and the generated JSON schema.
- `src/components/fields/effects.ts`: exported `defaultEffects`.
- `src/components/rect/descriptor.ts`: exported `SHAPE_KINDS`.
- `src/service/compact/effects.ts`: pure `expandEffects`.
- `src/service/compact/defaults.ts`: `FLAT_SHAPE_PATCH` and pure `applySceneDefaults`.
- `src/service/compact/expand.ts`: `ExpandState`, notices, effects and defaults wiring; `{ scene, notices }` return.
- `src/service/tools/scene-build.ts`: `notices` in the output; `defaults` in the description.
- `src/service/exports.ts`: shared `writeExport`, used by `scene_export`.
- `src/service/tools/scene-preview.ts`: `out`; returns `file`.
- `src/service/image.ts`, `src/mcp/server.ts`: optional `file`; extra text content.
- Tests in `src/service/compact/`, `src/service/`, `src/components/rect/` and `src/mcp/`, mirroring the sources.
