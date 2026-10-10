# 016 — three-d — Design

## Approach

- D1@2 (implements R1, R4, R5): A `three` descriptor draws through one three.js `WebGLRenderer` shared by every 3D element: each element renders in turn into it and is composited with `drawImage` (A25), so the number of elements is not limited by the browser's cap on live WebGL contexts; three.js is MIT (A18).
- D2@1 (implements R1): GLTF models load through the asset cache (`src/engine/images.ts` becomes `assets.ts`) and exports wait for them (A7@3).
- D3@1 (implements R2, R3): Material, light and camera are new reusable field groups (A23) whose numbers are animatable.

- D4@1 (implements R4): three.js is imported only inside `src/components/three/`; the rest of the app sees a plain descriptor, so the 3D library stays swappable.
- D5@1 (implements R5): Determinism is checked within one browser session (same t → same pixels, frame 0 equals the last frame + 1); results are not compared across machines or GPUs, which WebGL does not guarantee.

## Deliverables

`src/components/three/`, asset cache for models, model upload, field groups, presets.
