# 049 — image-trim-service — Tasks

- [ ] T001 [agent] [status:todo] `ImageProbe` port and `images` on `Ctx`
      covers: D1@1
- [ ] T002 [agent] [status:todo] `createBrowserImageProbe` adapter over `openApp`, lazy and disposed with the ctx
      covers: D2@1
- [ ] T003 [agent] [status:todo] `image_trim` tool and its shared trim step
      covers: D3@1
- [ ] T004 [agent] [status:todo] `trim: true` on `element_add` for images
      covers: D4@1
- [ ] T005 [agent] [status:todo] Register `image_trim` and document it in `AGENTS.md` and `README.md`
      covers: D5@1
- [ ] T006 [agent] [status:todo] Tests (fake probe): trim saves the crop with content in place; `element_add` with trim; unreadable, empty and non-image fail without saving
      covers: R1@1, R2@1, R4@1
      kind: test
- [ ] T007 [agent] [status:todo] Tests: the real browser probe finds the bounds of a margined PNG fixture; `image_trim` is listed by the MCP server and runs from the CLI
      covers: R1@1, R3@1
      kind: test
