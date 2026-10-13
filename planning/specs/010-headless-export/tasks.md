# 010 — headless-export — Tasks

- [x] T001 [agent] [status:done] Render-only route exposing the existing export functions
      covers: D1@1
      changes: src/editor/mount.tsx (+12 -0), src/export/render-page.ts (+40 -0), src/main.tsx (+8 -8)
- [x] T002 [agent] [status:done] Playwright renderer in `ctx` (installed Chrome first, H.264 else WebM)
      covers: D2@2, A21@1
      changes: package.json (+1 -0), pnpm-lock.yaml (+10 -0), src/service/ctx.ts (+21 -6), src/service/renderer.ts (+105 -0)
- [x] T003 [agent] [status:done] Tools `scene_export` and `scene_preview`; MCP returns the preview as an image
      covers: D3@1
      changes: .gitignore (+3 -0), src/cli/cli.test.ts (+4 -1), src/mcp/server.test.ts (+14 -1), src/mcp/server.ts (+10 -1), src/service/fake-renderer.ts (+19 -0), src/service/image.ts (+11 -0), src/service/service.test.ts (+33 -1), src/service/tools/index.ts (+4 -0), src/service/tools/scene-export.ts (+67 -0), src/service/tools/scene-preview.ts (+30 -0)
- [x] T004 [agent] [status:done] Test: export the demo scene to PNG, GIF and MP4; the PNG equals the editor export at the same t
      covers: R1@1, R2@1, R3@1
      kind: test
      changes: src/service/renderer.test.ts (+125 -0), src/service/renderer.ts (+34 -11)
- [x] T005 [agent] [status:done] CLI and MCP server dispose the renderer on exit; test: `pnpm lienzo scene_export` exits by itself, also after a failed export
      covers: D4@1
      changes: AGENTS.md (+14 -5), src/cli/main.ts (+9 -7), src/mcp/server.ts (+14 -3), src/service/renderer.test.ts (+88 -1)
      └─ do after T002
