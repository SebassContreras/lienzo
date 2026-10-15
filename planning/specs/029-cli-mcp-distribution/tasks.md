# 029 — cli-mcp-distribution — Tasks

- [x] T001 [agent] [status:done] Configure standalone bundle pipeline for src/cli/main.ts targeting dist/cli.js with shebang and Node 24 ESM output
      covers: D1@1
      changes: .env.example (+36 -0), .gitignore (+8 -0), AGENTS.md (+7 -0), package.json (+6 -0), pnpm-lock.yaml (+3 -0), presets/built-in/44-subtitulos-virales.json (+25 -0), src/cli/build.ts (+19 -0), src/components/fields/effects.ts (+1 -1), src/components/fields/index.ts (+1 -1), src/components/index.ts (+4 -1), src/components/subtitles/descriptor.ts (+94 -0), src/components/subtitles/draw.ts (+127 -0), src/components/subtitles/schema.ts (+18 -0), src/editor/app.tsx (+26 -2), src/editor/dialogs/tts-dialog.tsx (+540 -0), src/editor/field-editor.tsx (+16 -4), src/editor/stage.tsx (+18 -0), src/editor/timeline/audio-track-control.tsx (+234 -0), src/editor/widgets/cues-editor.tsx (+200 -0), src/engine/assets.ts (+45 -6), src/engine/audio/audio-export.ts (+83 -0), src/engine/audio/audio-player.ts (+171 -0), src/engine/audio/audio-timing.test.ts (+64 -0), src/engine/audio/audio-timing.ts (+84 -0), src/engine/clip.ts (+5 -1), src/engine/effects.test.ts (+37 -11), src/engine/effects.ts (+3 -1), src/engine/render.ts (+12 -3), src/engine/subtitles/cue-timing.ts (+29 -0), src/engine/subtitles/index.ts (+7 -0), src/engine/subtitles/layout.ts (+131 -0), src/engine/subtitles/parsers/srt.test.ts (+61 -0), src/engine/subtitles/parsers/srt.ts (+77 -0), src/engine/subtitles/parsers/vtt.ts (+131 -0), src/engine/subtitles/subtitles.test.ts (+244 -0), src/engine/subtitles/types.ts (+34 -0), src/engine/subtitles/word-window.ts (+87 -0), src/export/export.ts (+27 -2), src/export/video-encoder.ts (+40 -0), src/model/model.ts (+8 -0), src/model/scene-audio.test.ts (+113 -0), src/model/schema.ts (+8 -0), src/presets/store.ts (+6 -0), src/service/tools/element-remove.ts (+2 -1), src/service/tools/index.ts (+2 -0), src/service/tools/scene-generate-speech.ts (+138 -0), src/service/tts/asset-store.ts (+27 -0), src/service/tts/config.ts (+196 -0), src/service/tts/openrouter-adapter.ts (+98 -0), src/service/tts/preferences.ts (+125 -0), src/service/tts/scene-audio.ts (+81 -0), src/service/tts/speech-alignment.ts (+126 -0), src/service/tts/tts-config.test.ts (+277 -0), src/service/tts/tts.test.ts (+169 -0), src/service/tts/types.ts (+120 -0), src/test/recording-ctx.ts (+55 -0), vite.config.ts (+7 -2)

- [x] T002 [agent] [status:done] Ensure built-in preset and animation recipes are bundled or reliably accessible in standalone distribution mode
      covers: D2@1
      changes: src/cli/main.ts (+2 -1), src/service/root.ts (+21 -0)

- [x] T003 [agent] [status:done] Ensure headless rendering (playwright-core / vite) remains dynamically imported and cleanly handled in standalone bundle
      covers: D3@1
      changes: none

- [x] T004 [agent] [status:done] Verify CLI argument/JSON parsing and MCP stdio entrypoint in dist/cli.js
      covers: D4@1
      changes: none

- [x] T005 [agent] [status:done] Add automated tests for the built standalone bundle testing tool execution, MCP server handshake, and help output
      covers: R1@1, R2@1, R3@1, R4@1, R5@1
      kind: test
      changes: src/cli/distribution.test.ts (+105 -0)
