# 051 — nested-tools-and-validation — Design

## Approach

- D1@1 (implements R1, R2): `src/service/element-tree.ts` holds the pure tree lookup and immutable transformation helpers over `readonly Element[]` _(judgement, no standard)_: `findElement(elements, target, path = "id")` resolves a target across the full group hierarchy — when `target` contains `/`, it steps through each segment (`shot-1/s1-car`) checking that every intermediate element is a `group`; otherwise it searches the tree depth-first for a matching `id`, failing with `not_found` on zero matches or `ambiguous_id` if more than one element shares that `id`. `updateElement(elements, target, fn, path = "id")`, `updateSiblings(elements, target, fn, path = "id")` and `insertChild(elements, parentTarget, child)` return a new element tree with only the target's ancestor chain cloned.
- D2@1 (implements R1): `element_update`, `keyframe_set`, `keyframe_remove` and `image_trim` replace top-level `elementIndex` with `findElement` / `updateElement` from D1 _(judgement, no standard)_. `element_move` and `element_remove` use `updateSiblings` so layer reordering and deletion operate on the target's containing list (the scene root or the parent group's `children`), and `element_remove` also clears `effects.mask` references to the removed `id` across the entire tree.
- D3@1 (implements R2): `element_add` gains an optional `parent: z.string().min(1).optional()` _(judgement, no standard)_. When `parent` is omitted, the new element is appended to `scene.elements` and default-centred on `scene.width × scene.height` as before; when `parent` is given, `findElement(s.elements, parent, "parent")` verifies it exists and its `kind === "group"` (failing with `not_found` or `not_a_group` on path `"parent"` before any write), centres the element on `(group.cw / 2, group.ch / 2)` when neither `at` nor a position in `set` is given, and appends it to that group's `children` via `insertChild`.
- D4@1 (implements R3, R4): In `src/model/compact.ts`, `CompactElementSchema` replaces the blind `z.union` over all kinds with kind-directed dispatch in `superRefine` _(standard: Zod superRefine & issue paths — https://zod.dev/api#superrefine)_:
  1. Non-object inputs fail at the element's path.
  2. If `kind` is a registered component kind, it validates against that kind's cached per-kind object schema (with `children` recursively validated via `z.array(CompactElementSchema)` on `"group"` and `template` via `CompactElementSchema.nullable()` on `"particles"`) and forwards any child issues with their nested relative `path` preserved.
  3. If `kind` is present and not a registered kind, it reports an invalid `kind` issue at `[...path, "kind"]` listing the known kinds (R4).
  4. If `kind` is omitted and `preset` is a non-empty string, it validates against the preset-element schema.
  5. Otherwise (`kind` and `preset` both missing or empty), it reports a missing `kind` issue at `[...path, "kind"]` (R4).

## Deliverables

- `src/service/element-tree.ts` (+ `src/service/element-tree.test.ts`)
- `src/service/scenes.ts`, `src/service/tools/element-add.ts`, `src/service/tools/element-update.ts`, `src/service/tools/element-remove.ts`, `src/service/tools/element-move.ts`, `src/service/tools/keyframe-set.ts`, `src/service/tools/keyframe-remove.ts`, `src/service/tools/image-trim.ts`
- `src/model/compact.ts` (+ `src/model/compact.test.ts`), `src/service/service.test.ts`

## Sequencing

- D1 and D4 are pure and independent → D2 and D3 build on D1 → integration tests in `service.test.ts`.

## Trade-offs

- Dedicated `src/service/element-tree.ts` module vs inline recursion in each tool (D1, D2). Pros: 6 tools share one pure implementation (Principles 1, 2, 3 — DRY via composition and SRP); `scenes.ts` stays focused on I/O and validation. Cons: one new small file. Mitigation: exported pure functions tested directly in isolation without disk or tool harness overhead.
- Supporting both bare `id` and slash path `group/child` in the existing `id` field (D1). Pros: backwards-compatible with every existing MCP/CLI call while disambiguating or making shot hierarchy explicit when needed (R1). Cons: an element whose `id` literally contains `/` is treated as a path. Mitigation: generated IDs and compact slugs never contain `/`, and path traversal is the documented syntax for `/`.
- Centering group children on `(cw / 2, ch / 2)` when `parent` is set and no position is given (D3). Pros: group children live in the group's `cw × ch` coordinate space (`src/components/group/descriptor.ts`), so centering on scene dimensions would place them off-group. Cons: differs from root `scene.width / 2, scene.height / 2`. Mitigation: matches how `drawGroup` and `placeChild` map child coordinates.
- Manual kind dispatch in `CompactElementSchema` instead of `z.discriminatedUnion` or `z.union` (D4). Pros: `preset`-only elements have no `kind` (so `z.discriminatedUnion("kind", ...)` cannot be used directly), while `z.union` evaluates every branch and collapses failures into a generic union error or wrong-branch issue; dispatching on `kind` first gives O(1) schema selection and exact deep field paths (`elements.3.children.1.speed`). Cons: ~25 lines of explicit dispatch in `compact.ts` while keeping `buildCompactElementUnion()` for `generateCompactJsonSchema()`. Mitigation: per-kind schemas are built from the same `compactShapeOf(d.fields)` helper and cached per `registerCompactElementKinds` call.
