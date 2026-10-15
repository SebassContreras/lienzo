# 030 — dynamic-tts-config — Tasks

- [x] T001 [agent] [status:done] Runtime environment loader and config resolution
      covers: D1@1
      changes: src/service/tts/config.ts (+143 -13)
- [x] T002 [agent] [status:done] Dynamic base URL support in OpenRouter adapter
      covers: D2@1
      changes: src/service/tts/openrouter-adapter.ts (+13 -4), src/service/tts/types.ts (+1 -0)
- [x] T003 [agent] [status:done] Browser preferences persistence for TTS UI
      covers: D3@1
      changes: src/service/tts/preferences.ts (+122 -0)
- [x] T004 [agent] [status:done] Dynamic model and voice selection in TTS dialog
      covers: D4@1
      changes: src/editor/dialogs/tts-dialog.tsx (+289 -59)
- [x] T005 [agent] [status:done] Environment-based defaults resolution in scene_generate_speech tool
      covers: D5@1
      changes: src/service/tools/scene-generate-speech.ts (+26 -10)
- [x] T006 [agent] [status:done] Unit tests for dynamic TTS configuration, adapter, preferences, and tool resolution
      covers: R1@1, R2@1, R3@1, R4@1, R5@1, R6@1
      kind: test
      changes: src/service/tts/tts-config.test.ts (+282 -0)
