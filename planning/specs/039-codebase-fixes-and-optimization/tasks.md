# 039 — codebase-fixes-and-optimization — Tasks

- [x] T001 [agent] [status:done] Prune dead code, unused constants and obsolete types
      covers: D7@1, R7@1
      changes: .gitignore (+4 -0), projects/.gitkeep (+1 -0), src/editor/brand-manager.test.ts (+1 -3), src/editor/brand/brand-asset-manager.tsx (+89 -17), src/editor/brand/brand-palette-editor.tsx (+87 -18), src/editor/dialogs/brand-manager-dialog.tsx (+228 -55), src/editor/project-selector.tsx (+9 -5), src/engine/particle-field.ts (+1 -1), src/engine/subtitles/cue-timing.ts (+0 -7), src/engine/tracks.ts (+1 -1), src/service/project-middleware.test.ts (+12 -4), src/service/project-middleware.ts (+4 -4)
- [x] T002 [agent] [status:done] Deep-merge partial anim and shorthands in compact expandScene
      covers: D1@1, R1@1
      changes: src/service/compact/expand.test.ts (+32 -0), src/service/compact/expand.ts (+44 -17)
- [x] T003 [agent] [status:done] Allow recursive compact children in group elements and resolve them
      covers: D2@1, R2@1
      changes: src/model/compact.test.ts (+26 -0), src/model/compact.ts (+2 -0)
- [x] T004 [agent] [status:done] Fix subtitle karaoke highlight clearance to prevent word collision
      covers: D3@1, R3@1
      changes: src/components/subtitles/draw.ts (+1 -0), src/engine/subtitles/layout.ts (+7 -2), src/engine/subtitles/subtitles.test.ts (+23 -0)
- [x] T005 [agent] [status:done] Deduplicate scene render flow in scene_export and scene_preview
      covers: D4@1, R4@1
      changes: src/service/render-target.ts (+43 -0), src/service/tools/scene-export.ts (+3 -6), src/service/tools/scene-preview.ts (+6 -5)
- [x] T006 [agent] [status:done] Inject TtsService via Ctx for scene_generate_speech
      covers: D5@1, R5@1
      changes: src/service/ctx.ts (+5 -0), src/service/tools/scene-generate-speech.ts (+2 -1), src/service/tts/pluggable-tts.test.ts (+45 -0)
- [x] T007 [agent] [status:done] Memoize MCP tool schema generation and document client configuration
      covers: D6@1, D8@1, R6@1, R8@1
      changes: README.md (+39 -6)
- [x] T008 [agent] [status:done] Verify complete test suite and spectrace status
      covers: R1@1, R2@1, R3@1, R4@1, R5@1, R6@1, R7@1, R8@1
      kind: test
      changes: src/test/render.golden.json (+4 -4)
