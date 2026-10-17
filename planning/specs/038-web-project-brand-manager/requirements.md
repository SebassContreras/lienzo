# 038 — web-project-brand-manager — Requirements

## What's being built

A complete graphical Brand & Project Manager in the web editor shell. Allows creators to create, edit, customize, and delete brand project workspaces directly from the UI without touching the filesystem or CLI. Includes:
- A Brand Setup Modal with color pickers for brand palette (primary, secondary, accent, surface, text).
- Typography and canvas dimension presets configuration.
- Direct asset upload (logos, photos, fonts) routed into the project's own workspace (`projects/<slug>/assets/`).
- Preset saving tied directly to the active brand.

## Who it serves

- Content creators wanting to manage and switch brand kits 100% visually.
- Teams designing branded graphics who need instant access to their logo assets and color palette without dev tools.

## Requirements

- R1@1: UI Action & Modal: Add a "+ Nuevo Proyecto" and "Configurar Marca" button next to `ProjectSelector` in the header bar.
- R2@1: Brand Identity Form: Modal with inputs for project name, slug generator, color palette pickers (with hex/color input), and canvas defaults (width, height, fps, duration).
- R3@1: Project Asset Manager: Drag-and-drop / file selector in the project modal to upload logos, graphics, and badges directly into `projects/<slug>/assets/` via updated middleware endpoints.
- R4@1: Project Asset Endpoint: Extend Vite middleware (`/api/projects/:slug/assets`) allowing uploads scoped strictly to the project's folder.
- R5@1: Project Lifecycle UI: Ability to edit existing brand settings (PATCH) and delete project workspaces (DELETE) with confirmation dialog.
- R6@1: Seamless Context Switch: Automatically activate the newly created project in the app shell, instantly updating the inspector color swatches and asset library.

## Out of scope

- Cloud sync or multi-user access permissions (projects remain local to the user's workspace).

## Dependencies

001, 003, 007, 031.

## Owner split

All tasks agent.
