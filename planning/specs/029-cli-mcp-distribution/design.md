# 029 — cli-mcp-distribution — Design

## Approach

- D1@1 (implements R1, R2): Package the CLI and MCP entry point using a dedicated build configuration for `src/cli/main.ts` into `dist/cli.js` with shebang (`#!/usr/bin/env node`), platform target Node 24 ESM, while keeping `tsx src/cli/main.ts` intact for dev mode.
- D2@1 (implements R3): Resolve preset assets (`presets/built-in/*.json` and `presets/animations/*.json`) in standalone mode by bundling them or locating them reliably with fallback in the service store, ensuring preset and component inspection tools execute without repo cloning.
- D3@1 (implements R4): Externalize optional headless browser rendering dependencies (`playwright-core`, `vite`) in the bundle; keep runtime dynamic imports so non-render tools run with zero browser overhead, and fail gracefully with actionable diagnostics if export tools are invoked without browser binaries.
- D4@1 (implements R5): Preserve single-entrypoint invocation where `dist/cli.js <tool>` executes CLI commands and `dist/cli.js mcp` launches the MCP stdio server transport.

## Trade-offs (Pros / Cons / Mitigations)

- Inlined built-in presets vs runtime filesystem reads:
  - Pros: Standalone bundle has zero external file path dependencies when inspecting presets.
  - Cons: Slightly larger bundle size (~few tens of KB).
  - Mitigation: Built-in presets are small JSON files, easily bundled.
- Dynamic import of Playwright/Vite:
  - Pros: Instant startup for 95% of CLI/MCP tools that don't need browser rendering; minimal RAM usage.
  - Cons: Export commands require browser installed locally.
  - Mitigation: Clear error message when browser is missing (`launchBrowser`).

## Deliverables

- Build script and configuration (`build:cli`) bundling `src/cli/main.ts` into `dist/cli.js`.
- Updates to `package.json` for build script and executable binary mapping.
- Integration tests verifying standalone execution of `dist/cli.js`.

## Sequencing

Build configuration first (T001), followed by standalone asset resolution (T002), dynamic import handling for headless browser (T003), unified entrypoint verification (T004), and test suite (T005).
