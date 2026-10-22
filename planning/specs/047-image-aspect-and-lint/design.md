# 047 — image-aspect-and-lint — Design

## Approach

- D1@1 (implements R1): A pure `withImageAspects(scene, aspects)` in `src/editor/image-aspect.ts` sets `aspect` on each image (recursing into group children) whose `src` is in the map, returning the same scene when nothing changes. `loadScene` in `app.tsx` measures the scene's image sources with `imageSize` after opening and applies the map to the current scene through `setScene`, without `checkpoint`.
- D2@1 (implements R2): Replace each non-null assertion with a guard or a typed local; behaviour is unchanged.

## Deliverables

- `src/editor/image-aspect.ts`, `src/editor/image-aspect.test.ts`, `src/editor/app.tsx`
- the files Biome flags

## Trade-offs

- Fixing after opening (D1). Pros: the scene opens at once; applied to the current scene, edits made meanwhile are kept. Cons: one extra render. Mitigation: none needed, the change is invisible.
- Only `aspect`, not `h` (D1). Pros: saved layouts never move. Cons: a stretched image stays stretched until resized. Mitigation: the next corner resize snaps it back to its shape.
