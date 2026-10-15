# 028 — voice-tts — Tasks

- [x] T001 [agent] [status:done] OpenRouter configuration loader and API key resolution
      covers: D1@1
      changes: src/service/tts/config.ts (+64 -0)
- [x] T002 [agent] [status:done] TtsService interface and OpenRouter speech adapter
      covers: D2@1
      changes: src/service/tts/openrouter-adapter.ts (+94 -0), src/service/tts/types.ts (+119 -0)
- [x] T003 [agent] [status:done] Pure script-to-subtitle cue alignment helper
      covers: D4@1
      changes: src/service/tts/speech-alignment.ts (+126 -0)
- [x] T004 [agent] [status:done] Scene audio attachment and duration adjustment logic
      covers: D3@1
      changes: src/service/tts/scene-audio.ts (+81 -0)
- [x] T005 [agent] [status:done] Service tool scene_generate_speech for CLI and MCP
      covers: D5@1
      changes: src/service/tools/index.ts (+2 -0), src/service/tools/scene-generate-speech.ts (+122 -0), src/service/tts/asset-store.ts (+27 -0)
- [x] T006 [agent] [status:done] Editor voice generation modal dialog
      covers: D6@1
      changes: src/editor/app.tsx (+6 -0), src/editor/dialogs/tts-dialog.tsx (+305 -0)
- [x] T007 [agent] [status:done] Voice TTS adapter and speech alignment tests
      covers: R1@1, R2@1, R3@1, R4@1, R5@1, R6@1
      kind: test
      changes: src/service/tts/tts.test.ts (+141 -0)
