- [x] T001 [agent] [status:done] Project Zod schemas, TypeScript types, and manifest validation helpers
      covers: D1@1, R1@1
      changes: src/model/project.ts (+89 -0)
- [x] T002 [agent] [status:done] ProjectStore interface, filesystem adapter, and ctx wiring
      covers: D2@1, R2@1, R3@1
      changes: src/service/ctx.ts (+6 -2), src/service/project-store.ts (+186 -0)
- [x] T003 [agent] [status:done] project_create service tool
      covers: D3@1, R4@1
      changes: src/service/tools/project-create.ts (+70 -0)
- [x] T004 [agent] [status:done] project_list service tool
      covers: D3@1, R4@1
      changes: src/service/tools/project-list.ts (+20 -0)
- [x] T005 [agent] [status:done] project_inspect service tool
      covers: D3@1, R4@1
      changes: src/service/tools/project-inspect.ts (+35 -0)
- [x] T006 [agent] [status:done] project_delete service tool
      covers: D3@1, R4@1
      changes: src/service/tools/project-delete.ts (+29 -0)
- [x] T007 [agent] [status:done] Tool registry integration for project lifecycle tools
      covers: D3@1, R4@1
      changes: src/service/tools/index.ts (+8 -0)
- [x] T008 [agent] [status:done] Scoped asset and preset resolution with brand guardrails
      covers: D4@1, R5@1
      changes: src/service/project-store.ts (+65 -0), src/service/tools/element-add.ts (+26 -4), src/service/tools/scene-create.ts (+30 -3)
- [x] T009 [agent] [status:done] Vite dev server REST middleware for /api/projects/*
      covers: D5@1, R6@1
      changes: src/service/project-middleware.ts (+86 -0), vite.config.ts (+19 -1)
- [x] T010 [agent] [status:done] Web editor active project selector and palette context
      covers: D6@1, R7@1
      changes: src/editor/app.tsx (+21 -1), src/editor/controls.tsx (+52 -15), src/editor/project-context.ts (+11 -0), src/editor/project-selector.tsx (+90 -0)
- [x] T011 [agent] [status:done] Tests for ProjectStore and project lifecycle tools
      covers: D1@1, D2@1, D3@1, R1@1, R2@1, R4@1
      kind: test
      changes: src/service/project-tools.test.ts (+127 -0)
- [x] T012 [agent] [status:done] Tests for brand constraining and foreign asset warnings
      covers: D4@1, R5@1
      kind: test
      changes: src/service/brand-constraining.test.ts (+125 -0)
