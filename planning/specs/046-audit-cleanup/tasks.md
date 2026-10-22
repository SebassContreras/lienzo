- [x] T001 [agent] [status:done] Required project: `PresetStore`/`ProjectCtx`, `resolveProjectScope` without default, `PROJECT` field on every scene tool
      covers: D1@1
      changes: src/cli/cli.test.ts (+92 -14), src/mcp/server.test.ts (+17 -6), src/service/ctx.ts (+5 -2), src/service/project-boundary.test.ts (+12 -11), src/service/project-scope.ts (+13 -70), src/service/render-target.ts (+6 -8), src/service/renderer.test.ts (+4 -3), src/service/scenes.ts (+4 -4), src/service/service.test.ts (+11 -1), src/service/store.ts (+8 -12), src/service/tools/background-set.ts (+8 -3), src/service/tools/element-add.ts (+7 -7), src/service/tools/element-move.ts (+4 -2), src/service/tools/element-remove.ts (+8 -3), src/service/tools/element-update.ts (+4 -2), src/service/tools/keyframe-remove.ts (+4 -2), src/service/tools/keyframe-set.ts (+4 -2), src/service/tools/scene-build.ts (+3 -3), src/service/tools/scene-create.ts (+4 -7), src/service/tools/scene-export.ts (+4 -8), src/service/tools/scene-generate-speech.ts (+6 -9), src/service/tools/scene-get.ts (+3 -3), src/service/tools/scene-inspect-layout.ts (+15 -19), src/service/tools/scene-list.ts (+3 -3), src/service/tools/scene-preview.ts (+3 -4), src/service/tools/scene-validate.ts (+6 -2), src/service/tts/pluggable-tts.test.ts (+18 -0), src/service/tts/tts-config.test.ts (+18 -0)
- [x] T002 [agent] [status:done] `scene_export` keeps `out` inside the project's exports
      covers: D2@1
      changes: src/service/tools/scene-export.ts (+20 -6)
- [x] T003 [agent] [status:done] Test: scene tools fail without `project`, edit only the named project; `out` cannot escape
      covers: R1@1, R2@1
      kind: test
      changes: src/service/service.test.ts (+81 -6)
- [x] T004 [agent] [status:done] TTS proxy endpoint, no `OPENROUTER_` env in the browser, dialog through the proxy
      covers: D4@1
      changes: src/editor/dialogs/tts-dialog.tsx (+6 -5), src/service/tts-proxy.ts (+62 -0), src/service/tts/config.ts (+13 -31), src/service/tts/openrouter-adapter.ts (+9 -5), vite.config.ts (+19 -1)
- [x] T005 [agent] [status:done] Local TTS voice/model from env, drop undocumented aliases
      covers: D5@1
      changes: src/service/tts/config.ts (+21 -6), src/service/tts/local-adapter.ts (+7 -3)
- [x] T006 [agent] [status:done] Tests: proxy forwards with the server key; adapter without key on the proxy; local defaults from env
      covers: R4@1, R5@1
      kind: test
      changes: src/service/tts-proxy.test.ts (+63 -0), src/service/tts/pluggable-tts.test.ts (+27 -2), src/service/tts/tts.test.ts (+26 -23)
- [x] T007 [agent] [status:done] Remove dead files, routes, functions, script; un-export unused symbols
      covers: D6@1
      changes: package.json (+0 -1), src/animations/kind.ts (+1 -6), src/components/bubble/descriptor.ts (+1 -1), src/components/bubble/draw.ts (+2 -2), src/components/chart/descriptor.ts (+1 -1), src/components/counter/draw.ts (+2 -6), src/components/descriptor.ts (+3 -3), src/components/fields/anim.ts (+3 -14), src/components/fields/effects.ts (+2 -2), src/components/fields/field.ts (+2 -2), src/components/fields/label.ts (+1 -1), src/components/fields/stroke.ts (+1 -1), src/components/list/descriptor.ts (+1 -1), src/components/path/descriptor.ts (+1 -1), src/components/path/shapes.ts (+1 -1), src/components/progress/descriptor.ts (+1 -1), src/components/progress/draw.ts (+1 -1), src/components/steps/descriptor.ts (+1 -1), src/components/steps/draw.ts (+1 -1), src/components/subtitles/schema.ts (+2 -2), src/components/three/geometry.ts (+2 -2), src/components/three/pose.ts (+1 -1), src/editor/autosave.ts (+1 -1), src/editor/dialogs/brand-manager-dialog.tsx (+1 -1), src/editor/icon-picker.tsx (+1 -1), src/editor/snap.ts (+2 -2), src/editor/widgets/font-select.tsx (+1 -1), src/engine/assets.ts (+1 -1), src/engine/audio/audio-player.ts (+1 -1), src/engine/clip.ts (+1 -1), src/engine/effects.ts (+1 -1), src/engine/fonts.ts (+1 -1), src/engine/geometry.ts (+1 -1), src/engine/groups.ts (+1 -1), src/engine/lines.ts (+1 -1), src/engine/paint.ts (+1 -1), src/engine/particle-field.ts (+1 -1), src/engine/path/morph-prep.ts (+1 -1), src/engine/subtitles/index.ts (+0 -6), src/engine/subtitles/layout.ts (+2 -2), src/engine/subtitles/parsers/vtt.ts (+3 -7), src/engine/timing.ts (+2 -2), src/export/render-page.ts (+1 -1), src/mcp/server.ts (+2 -2), src/model/anim-preset.ts (+1 -1), src/model/compact.ts (+8 -15), src/model/font-files.ts (+2 -2), src/model/model.ts (+0 -8), src/model/preset.ts (+1 -1), src/model/project.ts (+3 -7), src/model/schema.ts (+4 -4), src/model/voice-preset.ts (+1 -1), src/presets/anim-presets.ts (+1 -1), src/presets/diff.ts (+1 -1), src/presets/json-store.ts (+1 -1), src/presets/store.ts (+0 -39), src/service/compact/expand.ts (+5 -5), src/service/compact/layout.ts (+1 -1), src/service/compact/tracks.ts (+2 -2), src/service/contrast.ts (+3 -3), src/service/font-install.ts (+1 -1), src/service/google-fonts.ts (+1 -4), src/service/layout.ts (+2 -2), src/service/project-middleware.ts (+0 -2), src/service/registry.ts (+2 -4), src/service/store.ts (+1 -1), src/service/tools/index.ts (+1 -1), src/service/tools/project-inspect.ts (+1 -1), src/service/tools/project-list.ts (+1 -1), src/service/tts/config.ts (+2 -51), src/service/tts/preferences.ts (+1 -1), src/service/tts/tts-config.test.ts (+0 -14), src/service/tts/types.ts (+1 -1), src/test/render-log.ts (+1 -4), src/traits/index.ts (+0 -1), src/traits/trait.ts (+2 -2), vite.config.ts (+1 -3)
- [x] T008 [agent] [status:done] Test: committed compact schema equals the generator
      covers: D7@1
      kind: test
      changes: src/model/compact-schema.test.ts (+12 -0)
- [x] T009 [agent] [status:done] Docs: tool descriptions, AGENTS.md, README.md, .env.example
      covers: D3@1
      changes: .env.example (+4 -3), AGENTS.md (+30 -20), README.md (+6 -5), src/service/tools/scene-create.ts (+1 -1), src/service/tools/scene-list.ts (+1 -1)
- [x] T010 [agent] [status:done] Renderer exit test exports inside the project (it wrote to a temp dir)
      covers: R2@1
      kind: test
      changes: src/service/renderer.test.ts (+3 -6)
