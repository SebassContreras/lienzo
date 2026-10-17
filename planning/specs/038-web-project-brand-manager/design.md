# 038 — web-project-brand-manager — Design

## Approach

- D1@1 (implements R1, R2): Add a dedicated Brand and Project Manager modal component (`src/editor/dialogs/brand-manager-dialog.tsx`) launched from `ProjectSelector` or topbar header actions ("+ Nuevo Proyecto", "Configurar Marca"). The modal provides two operational modes: creating a brand project (with auto-slug generator from project name) and editing an existing brand project (manifest, palette, typography, and default canvas settings).
- D2@1 (implements R2): Brand palette color picker controls (`src/editor/brand/brand-palette-editor.tsx`) provide individual color inputs and hex pickers for `primary`, `secondary`, `accent`, `surface`, and `text` conforming to `ColorPaletteSchema`, with instantaneous visual swatch feedback.
- D3@1 (implements R3, R4): Project-scoped asset upload endpoint (`/api/projects/:slug/assets`) in `src/service/project-middleware.ts` routes multipart/binary asset uploads directly into `projects/<slug>/assets/`, generating content-hashed filenames compatible with `assetStore` rules and returning `{ path: "/projects/<slug>/assets/<filename>" }` or project asset URLs.
- D4@1 (implements R3): A drag-and-drop & file selection asset manager widget (`src/editor/brand/brand-asset-manager.tsx`) inside the brand modal enables creators to upload and preview project logos, images, and fonts directly into the active brand workspace.
- D5@1 (implements R5): Project lifecycle actions (PATCH manifest updates and DELETE workspace removal) are integrated into the dialog with explicit confirmation modals preventing accidental data deletion and validating slug sanitization.
- D6@1 (implements R6): Client-side project switching hook / callback in `src/editor/app.tsx` and `ProjectSelector` propagates the active project slug and brand palette to `ProjectContext`, instantly re-scoping inspector swatches, canvas dimension defaults, and the library assets view.

## Deliverables

- `src/service/project-middleware.ts`: Extended request handler supporting `POST /api/projects/:slug/assets` for scoped asset uploading and `GET /api/projects/:slug/assets/:file` for asset serving.
- `src/editor/dialogs/brand-manager-dialog.tsx`: Core brand setup modal with tabs/sections for Identity (name, slug), Brand Palette, Canvas Defaults, and Asset Gallery.
- `src/editor/brand/brand-palette-editor.tsx`: Pure subcomponent for editing primary, secondary, accent, surface, and text hex values.
- `src/editor/brand/brand-asset-manager.tsx`: Project-scoped asset uploader and asset grid viewer.
- `src/editor/project-selector.tsx`: Updated header widget adding "+ Nuevo Proyecto" and "Configurar Marca" triggers next to the workspace dropdown.
- `src/editor/app.tsx`: Contextual integration updating canvas dimensions and inspector palette on project switch.
- `src/service/project-middleware.test.ts`: Unit test suite verifying `/api/projects/:slug/assets` endpoint routing and file storage.

## Sequencing

1. Extend `src/service/project-middleware.ts` to handle project asset upload (`POST /api/projects/:slug/assets`) and serving.
2. Verify middleware functionality with unit tests.
3. Build pure UI subcomponents: `brand-palette-editor.tsx` and `brand-asset-manager.tsx`.
4. Implement `brand-manager-dialog.tsx` orchestrating form state, project creation, PATCH updates, and DELETE confirmations.
5. Update `project-selector.tsx` with header action triggers and connect to `app.tsx`'s `ProjectContext`.
6. Verify end-to-end integration and run tests.

## Trade-offs

- **Pros**:
  - Full GUI parity: Users can manage multi-brand identities and project assets completely from the browser UI without terminal or file manager access.
  - Strict Isolation: Assets uploaded via the brand manager are scoped directly to `projects/<slug>/assets/`, avoiding namespace collisions and maintaining self-contained project directories (A7).
  - Separation of Concerns: Palette editor, asset manager, and dialog orchestration are separated into distinct, focused components following SRP and DRY principles.
- **Cons**:
  - Duplicate asset store logic: Project asset uploading mirrors some behavior from the root `/api/assets` handler.
- **Mitigations**:
  - Extract shared hashing and asset validation helpers into `src/service/asset-helpers.ts` or reuse existing constants (`ASSET_TYPES`, `MAX_ASSET_BYTES`) to avoid code duplication (DRY).

## Open questions

- None.
