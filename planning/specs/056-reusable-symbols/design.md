# 056 — reusable-symbols — Design

## Approach

- D1@1 (implements R1): Add an optional `symbols` registry to both canonical scene model/schema (`src/model/model.ts`, `src/model/schema.ts`) and compact schema/expander (`src/model/compact.ts`, `src/service/compact/expand.ts`) typed as `Record<string, SymbolDefinition>` where each symbol specifies `{ w: number; h: number; children: SceneElement[] }` (in compact scenes, children are compact elements that expand against the symbol's canvas dimensions).
- D2@1 (implements R2): Register a new component kind `use` (`src/components/use/descriptor.ts`, `src/components/use/draw.ts`) registered in `src/components/index.ts` with properties `{ symbol: string; x: number; y: number; w: number; h: number; opacity?: number; overrides?: Record<string, Record<string, unknown>> }` where `overrides` maps child element IDs or relative paths to field property override objects.
- D3@1 (implements R3): Pure drawing function `drawUse` in `src/components/use/draw.ts` resolves the symbol by name from `scene.symbols`, creates an instantiated deep-cloned slice of `children` with overrides applied via pure clone-and-patch traversal, and renders them scaled from `(w / symbol.w, h / symbol.h)` within the `use` element's transformed coordinate space; if `symbol` is missing or not found in `scene.symbols`, draws a non-crashing diagnostic placeholder bounding box (e.g. amber dashed outline with missing symbol label) and continues without error.
- D4@1 (implements R3): Extend `sceneInspectLayout` / `placedElementsAt` in `src/service/layout.ts` to inspect `use` elements: if a `use` references an undefined symbol, report an actionable diagnostic `{ code: "missing_symbol", elementId: el.id, message: "..." }`; when valid, flatten and place symbol children into spatial layout boxes for overlap, bounds, and contrast checks.
- D5@1 (implements R4): Ensure single source of truth for symbol definition edits: symbol definitions reside strictly in `scene.symbols`, so updating a symbol definition in `scene.symbols` automatically propagates to all `use` instances during scene rendering and inspection without mutating or duplicating child elements in the scene state.

## Trade-offs & Mitigations

### 1. In-memory runtime instantiation vs. Compile-time flattening
- **Pro**: Keeping `use` instances as first-class elements references `scene.symbols` dynamically. This satisfies R4 directly: editing `scene.symbols[name]` immediately reflects on every `use` instance without migrating/duplicating child elements. Compact JSON remains concise and DRY.
- **Con**: Drawing and layout inspection require resolving and instantiating symbol children on each frame / analysis pass.
- **Mitigation**: Pure functions with lightweight shallow/deep patch copies for overrides, reusing standard `drawElements` and canvas scale transforms `ctx.scale(w / symbol.w, h / symbol.h)`.

### 2. Overrides mapping format
- **Pro**: Keying `overrides` by target child id (e.g. `overrides: { "wheel-front": { fill: { color: "#333" } } }`) provides targeted, deterministic field override semantics without complex CSS-like selector engines.
- **Con**: If children inside a symbol lack explicit IDs, overrides cannot easily address them.
- **Mitigation**: Assign stable IDs to symbol children by default, or support index-based fallback paths (`"children.0"`), and document the ID-based override pattern.

### 3. Missing or cyclic symbol handling
- **Pro**: Safe fallback drawing prevents editor or rendering crashes if a symbol is missing or misnamed.
- **Con**: Silent failures might mask authoring mistakes during export or headless runs.
- **Mitigation**: Visual dashed placeholder on canvas combined with an explicit diagnostic in `scene_inspect_layout` (code: `"missing_symbol"`), alerting users and automated tools. Guard against recursive symbol references with a visited set check.

## Deliverables

- `src/model/model.ts`: `SymbolDefinition` and `Scene.symbols` definitions.
- `src/model/schema.ts`: `SymbolDefinitionSchema` and update to `SceneSchema`.
- `src/model/compact.ts`: `CompactSymbolSchema` and update to `CompactSceneSchema`.
- `src/components/use/descriptor.ts`: Component descriptor for kind `use`.
- `src/components/use/draw.ts`: Drawing logic for `use` instances with scaling, overrides, and missing-symbol placeholder fallback.
- `src/components/index.ts`: Register `use` component in `COMPONENTS` and `RegisteredElement`.
- `src/service/compact/expand.ts`: Expand compact symbols and `use` elements into canonical scene definitions.
- `src/service/layout.ts`: Layout placement and `"missing_symbol"` diagnostic handling for `use` elements.
- Unit and integration tests covering symbol registration, overrides application, fallback diagnostics, and reactivity to symbol updates.
