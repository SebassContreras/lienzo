# 031 — project-workspaces — Design

## Approach

- D1@1 (implements R1): Project models and Zod validation live in `src/model/project.ts` (`ProjectConfig`, `ColorPalette`, `BrandFont`, `ProjectManifest`, `ProjectSlug`), exporting parsing helpers and validation functions that return actionable errors on corrupt or missing manifests.
- D2@1 (implements R2, R3): File-based project storage operations are isolated behind the `ProjectStore` interface in `src/service/project-store.ts`, implemented as `createProjectStore(root: string)` and injected into `Ctx.projects`, managing `projects/<slug>/` (`project.json`, `assets/`, `presets/`, `scenes/`) without direct filesystem leaks into domain logic.
- D3@1 (implements R4): Project lifecycle operations are implemented as individual service tools in `src/service/tools/` (`project_create.ts`, `project_list.ts`, `project_inspect.ts`, `project_delete.ts`), registered in `src/service/index.ts` with explicit input/output schemas and Spanish error messages.
- D4@1 (implements R5): Tool brand enforcement in existing scene/element tools accepts an optional `project` slug parameter, constraining asset loading and preset resolution to `projects/<slug>/` and rejecting or warning when an asset or preset is foreign or unbranded.
- D5@1 (implements R6): The Vite dev server middleware in `vite.config.ts` delegates `/api/projects/*` endpoints to a dedicated request handler in `src/service/project-middleware.ts`, matching the `ProjectStore` REST contracts for web client parity.
- D6@1 (implements R7): The editor UI in `src/editor/app.tsx` and a new `ProjectSelector` component (`src/editor/project-selector.tsx`) manage the active project state, contextualizing the color picker palette swatches in the inspector and scoping the library assets to the active workspace.

## Deliverables

- `src/model/project.ts`: Zod schema and TypeScript domain models for project configurations, manifests, fonts, and palettes.
- `src/service/project-store.ts`: `ProjectStore` interface, factory `createProjectStore`, and filesystem adapter over `projects/<slug>/`.
- `src/service/ctx.ts`: Augmented `Ctx` type including `projects: ProjectStore`.
- `src/service/tools/project_create.ts`: Single-responsibility service tool to create new project workspaces.
- `src/service/tools/project_list.ts`: Single-responsibility service tool to enumerate available projects.
- `src/service/tools/project_inspect.ts`: Single-responsibility service tool to inspect project manifests and available brand assets.
- `src/service/tools/project_delete.ts`: Single-responsibility service tool to cleanly remove project workspaces.
- `src/service/project-middleware.ts`: Dev-server request handler serving `/api/projects/*`.
- `src/editor/project-selector.tsx`: Active project dropdown component integrated into the editor shell header.
- `src/editor/project-context.ts` / hooks: Client-side active project state and asset/palette resolution.
- Test suites: Minimal contract and pure logic tests in `test/project-store.test.ts` and `test/tools/project-tools.test.ts`.

## Sequencing

1. Domain models and Zod schemas (`src/model/project.ts`) must be created first before the store and tools.
2. `ProjectStore` interface and implementation in `src/service/` followed by `Ctx` wiring.
3. Service tools (`project_create`, `project_list`, `project_inspect`, `project_delete`) and tool registration.
4. Tool project parameter scoping / brand constraining.
5. Vite middleware for `/api/projects/*` REST endpoints.
6. Editor UI components, active project selector, and brand palette contextualization.
7. Verification tests for store, tools, and brand constraints.

## Trade-offs

- **Pros**:
  - Clean boundary: Workspaces are self-contained folders with zero database dependency, aligning with A7.
  - Testability: Abstracting `ProjectStore` behind an interface allows pure in-memory or temp-folder test fixtures without mocking global Node fs.
  - Brand Guardrails: AI agents running via MCP/CLI are strictly bounded to approved color palettes and assets, avoiding visual drift.
- **Cons**:
  - Local duplication: When multiple projects share an identical stock asset, it must reside within each project's `assets/` directory or remain globally scoped.
  - Filesystem slug conflicts: Projects rely on folder slugs on disk, which could encounter invalid filename characters across operating systems (especially Windows).
- **Mitigations**:
  - Standardize slug sanitization via strict regex (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) in the Zod schema.
  - Allow explicit fallback to global assets/presets when no active project is specified, retaining backwards compatibility.

## Open questions

- None. Scope and contracts are well-defined and align with existing architecture.
