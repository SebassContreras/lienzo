# 029 — cli-mcp-distribution — Requirements

## What's being built

A standalone build pipeline and distribution bundle for Lienzo's CLI and MCP server, allowing them to be packaged and run directly with standard Node (e.g. `node dist/cli.js` or via npx / global package) while preserving the instant TypeScript execution via `tsx` (`pnpm lienzo`) during development.

## Who it serves

- Developers and external agents who want to integrate Lienzo's MCP server or CLI without cloning the full repository, installing devDependencies, or relying on `tsx`.
- Contributors who want rapid iterative development with `tsx` without having to rebuild on every change.

## Requirements

- R1@1: A dedicated build script (`pnpm build:cli`) bundles `src/cli/main.ts` into a standalone Node executable in `dist/` (e.g. `dist/cli.js`), including the shebang `#!/usr/bin/env node`.
- R2@1: The build process preserves existing development workflows: `pnpm lienzo <tool>` and `pnpm lienzo mcp` continue executing directly from source via `tsx` without requiring a prior build step.
- R3@1: Built-in presets (recipes in `presets/built-in/` and animations in `presets/animations/`) are bundled or made accessible to the standalone CLI/MCP distribution so tools like `preset_list`, `preset_get`, and `element_add` work in standalone mode.
- R4@1: Headless rendering dependencies (`playwright-core` and dynamic Vite server dependencies) are handled gracefully: tools that do not require browser rendering run purely in Node, while export/preview tools clearly report browser requirements if missing.
- R5@1: The resulting CLI distribution supports both command-line arguments/JSON execution and MCP server mode (`mcp`) over stdio.

## Out of scope

- Compiling native platform binaries (pkg/sea) for Windows/Mac/Linux.
- Publishing to the public npm registry (packaging configuration only).

## Dependencies

008, 009.

## Owner split

All tasks agent.
