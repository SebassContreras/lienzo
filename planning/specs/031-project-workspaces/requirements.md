# 031 — project-workspaces — Requirements

## What's being built

An isolated project workspaces system (`projects/<slug>/`) managed through an inverted storage interface (`ProjectStore`). Each project encapsulates its visual identity (`project.json`: color palette, fonts, default canvas dimensions), its local assets (`assets/`: logos, photos, images), and its local element/animation presets (`presets/`).

Allows activating a project both in the web editor and via CLI/MCP (`--project <slug>`), constraining AI agents and automation tools to operate strictly within the declared brand assets, presets, and color palettes without drifting or hallucinating inconsistent styles.

## Who it serves

- Creators managing multiple client brands or distinct visual identities locally.
- AI agents via MCP that need strict boundaries and project grounding to compose cohesive branded content.

## Requirements

- R1@1: Zod schema and TypeScript domain models in `src/model/project.ts` (`ProjectConfig`, `ColorPalette`, `BrandFont`, `ProjectManifest`) with strict validation and error handling for damaged manifests.
- R2@1: Storage adapter interface and implementation `ProjectStore` in `src/service/project-store.ts` injected into `ctx.projects`, abstracting file system access for decoupled testability.
- R3@1: Self-contained filesystem structure at `projects/<slug>/` containing `project.json`, `assets/`, `presets/`, and `scenes/`. New projects are created clean from scratch.
- R4@1: Dedicated single-responsibility service tools in `src/service/tools/`:
  - `project_create`: creates a new project workspace given a slug and optional brand settings.
  - `project_list`: enumerates all available projects on disk with metadata.
  - `project_inspect`: inspects a project's full brand guide, available local assets, and presets.
  - `project_delete`: deletes an existing project workspace cleanly.
- R5@1: Project context constraining in MCP/CLI: tools (`scene_create`, `element_add`, etc.) accept an optional `project` parameter; when provided, references to assets and presets are resolved within the project's workspace, rejecting or warning against foreign/unbranded assets.
- R6@1: Vite development server middleware (`/api/projects/*`) providing REST endpoints matching the `ProjectStore` interface for web editor parity.
- R7@1: Web editor UI integration: active project selector in the application shell; selecting a project contextualizes the inspector's color picker swatches to the brand palette and filters the library panels to show project-specific assets and presets.

## Out of scope

- Cloud storage, remote synchronization, or user authentication.
- Git repository management per project (versioning remains repository-wide).

## Dependencies

003, 007, 008, 009.

## Owner split

All tasks agent.
