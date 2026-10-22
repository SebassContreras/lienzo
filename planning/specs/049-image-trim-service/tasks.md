# 049 — image-trim-service — Tasks

- [x] T001 [agent] [status:done] `ImageProbe` port and `images` on `Ctx`
      covers: D1@1
      changes: src/service/ctx.ts (+2 -0), src/service/image-probe.ts (+15 -0)
- [x] T002 [agent] [status:done] `createBrowserImageProbe` adapter over `openApp`, lazy and disposed with the ctx
      covers: D2@1
      changes: src/editor/widgets/image-crop.tsx (+1 -1), src/editor/image-pixels.ts → src/engine/image-pixels.ts (+1 -1), src/export/render-page.ts (+12 -0), src/service/ctx.ts (+7 -2), src/service/image-probe.ts (+20 -0), src/service/renderer.ts (+30 -16)
- [x] T003 [agent] [status:done] `image_trim` tool and its shared trim step
      covers: D3@1
      changes: src/service/image-trim.ts (+34 -0), src/service/tools/image-trim.ts (+31 -0)
- [x] T004 [agent] [status:done] `trim: true` on `element_add` for images
      covers: D4@1
      changes: src/service/tools/element-add.ts (+6 -1)
- [x] T005 [agent] [status:done] Register `image_trim` and document it in `AGENTS.md` and `README.md`
      covers: D5@1
      changes: AGENTS.md (+3 -0), README.md (+2 -0), src/service/tools/index.ts (+2 -0)
- [x] T006 [agent] [status:done] Tests (fake probe): trim saves the crop with content in place; `element_add` with trim; unreadable, empty and non-image fail without saving
      covers: R1@1, R2@1, R4@1
      kind: test
      changes: src/service/tools/image-trim.test.ts (+155 -0)
- [x] T007 [agent] [status:done] Tests: the real browser probe finds the bounds of a margined PNG fixture; `image_trim` is listed by the MCP server and runs from the CLI
      covers: R1@1, R3@1
      kind: test
      changes: src/cli/cli.test.ts (+18 -0), src/components/image/descriptor.ts (+1 -1), src/engine/image-pixels.ts (+1 -1), src/service/image-probe.test.ts (+81 -0), src/service/service.test.ts (+1 -0)
