# 016 — three-d — Design

## Approach

- D1@1 (implements R1, R4, R5): A `three` descriptor draws through three.js into an offscreen WebGL canvas per element and composites it with `drawImage` (A25); three.js is MIT (A18).
- D2@1 (implements R1): GLTF models load through the asset cache (`src/engine/images.ts` becomes `assets.ts`) and exports wait for them (A7@3).
- D3@1 (implements R2, R3): Material, light and camera are new reusable field groups (A23) whose numbers are animatable.

## Deliverables

`src/components/three/`, asset cache for models, model upload, field groups, presets.
