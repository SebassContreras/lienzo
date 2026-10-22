# 044 — nested-asset-drag — Design

## Approach

- D1@1 (implements R1): `project-store.ts` lists `assets` recursively (`readdir` with `recursive: true`, files only, POSIX separators); presets and scenes stay flat.
- D2@1 (implements R2, R4): `GET /api/projects/<slug>/assets/<path...>` in `project-middleware.ts` accepts several segments; each is decoded and checked against `^[\w.-]+$`, `..` is rejected, and the resolved path must stay inside the assets folder. The tab builds URLs by encoding each segment separately.
- D3@1 (implements R2): The tile `<img>` gets `draggable={false}` so the tile, not the image, is the drag source; tiles show the relative path.
- D4@1 (implements R3): On drop, `stage.tsx` awaits `imageSize(src)` and sets `h = w * height / width` before `onDropElement`.

## Deliverables

- `src/service/project-store.ts`, `src/service/project-middleware.ts` (+ tests)
- `src/editor/sidebar/project-assets-tab.tsx`, `src/editor/stage.tsx`
