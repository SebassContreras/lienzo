# 002 — more-components — Tasks

- [x] T001 [agent] [status:done] Ellipse component, inspector section and ellipse line attachment
      covers: D1@1
      changes: src/components/ellipse.ts (+22 -0), src/components/rect.ts (+24 -11), src/editor/app.tsx (+11 -3), src/editor/backgrounds.tsx (+16 -8), src/editor/inspector.tsx (+24 -14), src/editor/stage.tsx (+1 -1), src/engine/geometry.ts (+38 -10), src/engine/render.ts (+2 -0), src/model/model.ts (+22 -1), src/presets/resolve.test.ts (+8 -1), src/presets/resolve.ts (+2 -4), src/traits/bg-glow.ts (+1 -1), src/traits/border.ts (+1 -1), src/traits/breathe.ts (+1 -1), src/traits/fade-in.ts (+1 -1), src/traits/fill.ts (+1 -1), src/traits/float.ts (+1 -1), src/traits/glass.ts (+1 -1), src/traits/glow.ts (+1 -1), src/traits/index.ts (+6 -1), src/traits/no-glow.ts (+1 -1), src/traits/no-shadow.ts (+1 -1), src/traits/pulse.ts (+1 -1), src/traits/trait.ts (+28 -1)
- [x] T002 [agent] [status:done] Icon component drawn from lucide icon nodes, with a searchable picker
      covers: D2@1, A11@1
      changes: package.json (+1 -0), pnpm-lock.yaml (+8 -0), src/components/icon.ts (+61 -0), src/editor/app.tsx (+4 -1), src/editor/icon-picker.tsx (+89 -0), src/editor/inspector.tsx (+174 -0), src/engine/icon-shapes.ts (+112 -0), src/engine/render.ts (+2 -0), src/model/model.ts (+75 -12), src/styles.css (+31 -0), src/traits/trait.ts (+2 -0)
- [x] T003 [agent] [status:done] Image component with the `assets/` upload middleware
      covers: D3@1, A7@2
      changes: biome.json (+1 -0), src/components/image.ts (+77 -0), src/editor/app.tsx (+4 -1), src/editor/inspector.tsx (+238 -60), src/editor/stage.tsx (+5 -0), src/engine/images.ts (+67 -0), src/engine/render.ts (+2 -0), src/export/export.ts (+2 -0), src/model/model.ts (+51 -1), src/presets/store.ts (+14 -0), src/styles.css (+18 -0), src/traits/trait.ts (+2 -0), vite.config.ts (+86 -1)
      └─ reviewed 2026-10-07: A7@2 only adds `assets/` to the versioned folders; this work still holds
- [x] T004 [agent] [status:done] Multi-select: shift-click, selection box, move together
      covers: D4@1
      changes: src/editor/app.tsx (+62 -34), src/editor/inspector.tsx (+31 -0), src/editor/stage.tsx (+118 -47), src/engine/geometry.ts (+25 -0)
- [x] T005 [agent] [status:done] Groups: group/ungroup, draw, resize, animate, attachments inside groups
      covers: D4@1
      changes: src/components/group.ts (+31 -0), src/editor/app.tsx (+51 -15), src/editor/inspector.tsx (+73 -1), src/engine/geometry.ts (+35 -1), src/engine/groups.ts (+107 -0), src/engine/images.ts (+1 -0), src/engine/render.ts (+19 -4), src/model/model.ts (+73 -5), src/traits/trait.ts (+2 -0)
- [x] T006 [agent] [status:done] Save and drop groups as presets
      covers: D5@1
      changes: src/editor/app.tsx (+8 -2), src/engine/groups.ts (+17 -0), src/presets/diff.ts (+60 -1), src/presets/resolve.ts (+37 -0), src/presets/round-trip.test.ts (+101 -2)
- [x] T007 [agent] [status:done] Built-in presets for the new components
      covers: D6@2
      changes: presets/built-in/14-tarjeta-con-icono.json (+59 -0), presets/built-in/15-icono-con-fondo.json (+14 -0), presets/built-in/16-avatar-circular.json (+29 -0), presets/built-in/17-logo-imagen.json (+11 -0), src/presets/recipes.test.ts (+31 -15), src/presets/resolve.test.ts (+3 -0), src/traits/float.ts (+6 -0), src/traits/glow.ts (+4 -1), src/traits/pulse.ts (+6 -0)
- [x] T008 [agent] [status:done] Test: geometry of ellipse attachment and group coordinate mapping; icon node parsing
      covers: R1@1, R2@1, R4@1
      kind: test
      changes: src/engine/shapes.test.ts (+200 -0)
- [x] T009 [agent] [status:done] Test: build an icon-card grid in the browser from presets and export it
      covers: R1@1, R2@1, R3@1, R4@1, R5@1, R6@1
      kind: test
      changes: none
- [x] T010 [agent] [status:done] Keep `assets/` in the repo with a `.gitkeep`
      covers: A7@2
      changes: assets/.gitkeep (+0 -0)
- [x] T011 [agent] [status:done] README and AGENTS.md describe the new components, shortcuts, folders and the steps to add a component
      covers: D1@1, D2@1, D3@1, D4@1, D5@1, D6@2, A7@2
      changes: AGENTS.md (+12 -5), README.md (+21 -7)
