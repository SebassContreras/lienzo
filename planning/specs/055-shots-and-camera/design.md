# 055 — shots-and-camera — Design

## Approach

- D1@1 (implements R1): `Scene` (`src/model/model.ts`) and `SceneSchema` (`src/model/schema.ts`) support an optional `shots?: Shot[]` array (`Shot` = `{ id: string, name: string, start: number, end: number, transition?: { kind: "cut" | "fade" | "slide" | "zoom", duration: number }, camera?: { x?: number, y?: number, zoom?: number, tracks?: Tracks } }`), and `ElementOf` (`src/components/descriptor.ts`), `ElementSchema` (`src/model/element-schema.ts`), and `CompactElementSchema` (`src/model/compact.ts`) support an optional top-level `shot?: string` binding property _(standard: W3C Media Source Extensions & SMPTE Multi-Camera Shot Lists — https://www.w3.org/TR/media-source/)_. Omitted `shots` preserves the default single-shot timeline behavior across the entire scene duration.
- D2@1 (implements R2): During rendering (`drawElements` in `src/engine/render.ts`), an element bound to a `shot` is active only within the shot's effective time interval `[start, end]` (plus incoming/outgoing transition overlap duration) and is skipped entirely when outside its active window; elements without `shot` render across the entire scene as persistent/global layers _(standard: CSS Animations and SVG Timing model — https://www.w3.org/TR/css-animations-1/)_. At time `t`, the active shot's camera parameters (`x`, `y`, `zoom`, evaluated with camera keyframe tracks via `evaluateTrack` in `src/engine/tracks.ts` relative to scene center `[width/2, height/2]`) apply a global 2D view transform (`translate` and `scale`) on the canvas context for that shot, seamlessly reverting between shots or when transitions blend between two cameras.
- D3@1 (implements R3): A dedicated service tool `shot_set` (`src/service/tools/shot-set.ts`) allows creating, updating, or deleting shots (and configuring their transitions and camera parameters) in a scene by `id`, `CompactSceneSchema` (`src/model/compact.ts`) accepts `shots?: CompactShot[]`, and `expandScene` (`src/service/compact/expand.ts`) normalizes compact shots into the canonical `Scene.shots` representation. In the editor, a dedicated shots strip in `EditorFooter` (`src/editor/footer/editor-footer.tsx`) visually renders shot blocks along the timeline scrub bar with their names and boundaries.
- D4@1 (implements R4): In `resolveAtPlacement` (`src/service/compact/layout.ts`), `at` anchor calculations on an element nested inside a parent `group` resolve against the parent group's container dimensions (`cw = parentGroup.w`, `ch = parentGroup.h`) rather than the root `scene.width × scene.height` canvas dimensions, properly positioning nested children within their group coordinate frames _(standard: CSS Box Alignment Module Level 3 container-relative positioning — https://www.w3.org/TR/css-align-3/)_.
- D5@1 (implements R5): `placedElementsAt` in `src/service/layout.ts` computes effective opacity at time `t` (checking `in`/`out` entry/exit timing, shot `[start, end]` activation windows, element `opacity`, and ancestor group opacities). If effective opacity is `<= 0`, the element is skipped from spatial inspection (preventing false out-of-bounds, collision, or contrast warnings for invisible or inactive off-shot elements). Every diagnostic produced by `inspectLayout` (`src/service/tools/scene-inspect-layout.ts`) carries an optional `shot?: string` field copied from the element's binding.
- D6@1 (implements R6): The editor's layers panel (`src/editor/layers-panel.tsx`) adds a search input filtering elements by name/id substring, organizes layers into collapsible shot sections based on `el.shot`, and listens to changes in canvas selection (`selection`) to auto-expand collapsed shot groups and scroll the selected layer row into view via `scrollIntoView({ block: "nearest" })` _(standard: WAI-ARIA Treeview Design Pattern — https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)_.

## Deliverables

- `src/model/model.ts`, `src/model/schema.ts`, `src/model/element-schema.ts`: `Shot`, `ShotTransition`, `ShotCamera`, `Scene.shots`, and `Element.shot` schemas and types.
- `src/engine/render.ts`: shot time-window gating and camera view transform in `drawElements`.
- `src/service/tools/shot-set.ts` & `src/service/tools/index.ts`: `shot_set` tool for creating, updating, or removing shots.
- `src/model/compact.ts` & `src/service/compact/expand.ts`: compact scene `shots` parsing and expansion.
- `src/service/compact/layout.ts`: group-relative `at` positioning using parent group `cw × ch`.
- `src/service/layout.ts` & `src/service/tools/scene-inspect-layout.ts`: opacity/shot gating and `shot` property in `LayoutDiagnostic`.
- `src/editor/footer/editor-footer.tsx`: timeline shot block markers.
- `src/editor/layers-panel.tsx`: layer search filter, shot grouping, and selection auto-reveal.
- `src/service/shots.test.ts`, `src/service/compact/expand.test.ts`, `src/service/layout.test.ts`, `src/editor/layers-panel.test.tsx`: comprehensive unit and integration tests.

## Sequencing

- D1 (Shot types & element binding in model and schemas) → D2 (Render engine shot gating & camera view transform in `render.ts`) → D3 (`shot_set` tool and compact shots expansion) → D4 (Group-relative `at` anchor resolution in `compact/layout.ts`) → D5 (`scene_inspect_layout` opacity/shot gating and diagnostics) → D6 (Layers panel search, shot grouping, and selection auto-scroll).

## Trade-offs

- Defining shots at the root scene level (`Scene.shots`) and binding elements via `el.shot: "<id>"` vs separate scene files or nested shot container elements (D1, D2).
  - Pros: Preserves single-pass `drawScene(ctx, scene, t)` determinism (A3) and flat element ordering without breaking existing element tree hierarchies, groups, connectors, or keyframe timelines. Elements without a `shot` naturally behave as global overlays (logos, captions, background audio).
  - Cons: Requires element-level shot resolution and time-window filtering during render and layout passes.
  - Mitigation: Centralize shot interval and opacity lookup in a small pure helper (`isElementActiveAt(el, t, shots)`) in `src/engine/shots.ts`.
- Applying camera view transforms via 2D canvas context manipulation (`ctx.translate`, `ctx.scale`) vs recalculating every individual element's coordinates (D2).
  - Pros: Clean, instant, mathematical view transform that moves and zooms all elements within the shot simultaneously without mutating element properties or breaking component drawing logic (Principles 1, 3).
  - Cons: Canvas transforms could affect line widths or border radiuses if not intended, but for camera pans and zooms (cinematic scale/translate), scaling the entire canvas coordinate frame is the standard behavior in 2D animation engines.
  - Mitigation: Pivot camera zoom and translate relative to the stage center `(width / 2, height / 2)` so `zoom: 1, x: 0, y: 0` is an exact no-op `identity` transform.
- Group-relative `at` placement in compact scenes vs always using scene-canvas coordinates (D4).
  - Pros: Allows modular, self-contained reusable component cards and nested layouts whose children remain positioned consistently when the group is moved or sized, directly satisfying R4 and Principle 3 (composition).
  - Cons: Previous compact scenes with elements inside groups might have relied on full scene coordinates if they passed `at`.
  - Mitigation: `resolveAtPlacement` receives the parent group's container dimensions `cw, ch` when inside a group, defaulting cleanly to root scene `width, height` when at top-level.
