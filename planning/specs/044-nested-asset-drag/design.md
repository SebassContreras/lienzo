# 044 — nested-asset-drag — Design

## Approach

- D1@1 (implements R1): `project-store.ts` lists `assets` recursively (`readdir` with `recursive: true`, files only, POSIX separators); presets and scenes stay flat.
- D2@2 (implements R2, R4): `GET /api/projects/<slug>/assets/<path...>` in `project-middleware.ts` accepts several segments. One pure function, `safeAssetPath(segments)` in `src/service/asset-path.ts`, decodes each segment, accepts only `^[\w][\w.-]*$` (so no `..`, no empty or absolute segment) and returns the relative POSIX path or `undefined`; the route and the store both use it. The tab builds URLs by encoding each segment separately.
- D3@1 (implements R2): The tile `<img>` gets `draggable={false}` so the tile, not the image, is the drag source; tiles show the relative path.
- D4@1 (implements R3): On drop, `stage.tsx` awaits `imageSize(src)` and sets `h = w * height / width` before `onDropElement`.

- D5@1 (implements R5): `validateAsset` in `project-store.ts` takes the part after `/assets/` of the reference, checks it with `safeAssetPath` and looks for that relative path, instead of only the last file name.

## Deliverables

- `src/service/project-store.ts`, `src/service/project-middleware.ts` (+ tests)
- `src/editor/sidebar/project-assets-tab.tsx`, `src/editor/stage.tsx`

## Trade-offs

- Recursive listing (D1). Pros: any folder layout works. Cons: a large tree is slow to list. Mitigation: files only, dot-files and dot-folders skipped, no symlink following (`readdir` recursive does not follow them).
- Strict segment pattern (D2). Pros: one small rule blocks traversal and odd names. Cons: names with spaces or accents are not served. Mitigation: uploads already use hash names; the tab marks files it cannot serve instead of hiding them.
- Measuring the image on drop (D4). Pros: no stretched images. Cons: the drop waits for the image to decode. Mitigation: it is already cached by the tab thumbnail; on failure the default box is kept.
