# 040 — project-centric-storage — Design

## Approach

- D1@1 (implements R1): Initialize `projects/mi-proyecto/` with a valid `project.json` (slug `mi-proyecto`, name `"Mi Proyecto"`), structured with `scenes/`, `assets/`, `presets/`, and move `ejemplo-keyframes.json` into `projects/mi-proyecto/scenes/`.
- D2@1 (implements R2): Migrate existing orphaned assets and scenes into `projects/sebas-contreras/`, and remove root directories `scenes/`, `assets/`, and `exports/`.
- D3@1 (implements R3, R4): Implement `src/service/project-scope.ts` with `resolveProjectScope(ctx: Ctx, project?: string)` that resolves to `mi-proyecto` by default and returns an effective scoped context. Update `ProjectStore.checkAsset` and boundary validators in `src/service/project-store.ts` to strictly reject asset references pointing to other projects.
- D4@1 (implements R3, R4): Update service tools (`scene_build`, `scene_create`, `scene_export`, `scene_preview`, `scene_get`, `scene_list`, `scene_generate_speech`, `element_add`) to use `resolveProjectScope`, store generated speech into `projects/<slug>/assets/`, and write exports to `projects/<slug>/exports/`.
- D5@1 (implements R5): Adapt Vite dev middleware in `vite.config.ts` and `src/service/project-middleware.ts` to route `/api/scenes` and asset requests to the active project workspace (`mi-proyecto` by default), and connect `src/presets/scene-files.tsx` to project scenes.
- D6@1 (implements R6): Update `.gitignore` to track only `projects/mi-proyecto/`, and update `AGENTS.md`, `README.md`, and `planning/architecture.md` with strict project boundaries.

## Deliverables

- `projects/mi-proyecto/`: Default committed workspace with manifest, assets, presets, and sample scene.
- `src/service/project-scope.ts`: Pure helper resolving target project context and default fallback.
- `src/service/project-store.ts`: Boundary validation rejecting foreign project assets.
- `src/service/tools/`: Updated scene and asset tools operating within the resolved project scope.
- `src/service/tts/asset-store.ts`: Project-scoped audio asset saving.
- `vite.config.ts`: Cleaned middleware routing requests to project workspaces.
- `src/presets/scene-files.tsx`: Project-scoped scene file manager in editor.
- `.gitignore`, `AGENTS.md`, `README.md`, `planning/architecture.md`: Updated rules and documentation.
- `src/service/project-boundary.test.ts`: Unit tests validating isolation and default project fallback.

## Sequencing

1. Initialize `projects/mi-proyecto/`, migrate `sebas-contreras`, and remove root folders `scenes/`, `assets/`, `exports/`.
2. Implement project scope helper and boundary enforcement in `project-store.ts`.
3. Update service tools (`scene_build`, `scene_create`, `scene_export`, `scene_generate_speech`, etc.) and TTS asset saving.
4. Update Vite middleware and editor UI (`scene-files.tsx`, `app.tsx`).
5. Update `.gitignore`, documentation, and run full test verification.

## Trade-offs

- **Pros**:
  - Eliminates root directory clutter and prevents data fragmentation.
  - Strict boundary ensures projects are fully portable and isolated.
  - Consistent developer & agent experience: always working inside a project.
- **Cons**:
  - Legacy scripts expecting outputs at `exports/<name>.png` will see files placed at `projects/<slug>/exports/<name>.png`.
- **Mitigations**:
  - Explicit `out` parameter in `scene_export` is respected if provided.

## Open questions

- None.
