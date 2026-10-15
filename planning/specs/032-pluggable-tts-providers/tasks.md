# 032 — pluggable-tts-providers — Tasks

- [x] T001 [agent] [status:done] Provider and local endpoint resolution in TTS config
      covers: D2@1
      changes: src/service/tts/config.ts (+50 -0)
- [x] T002 [agent] [status:done] LocalTtsAdapter implementation for local/Kokoro speech synthesis
      covers: D3@1
      changes: src/service/tts/local-adapter.ts (+145 -0)
- [x] T003 [agent] [status:done] Factory function and unified service resolver for TTS providers
      covers: D1@1
      changes: src/service/tts/factory.ts (+37 -0)
- [x] T004 [agent] [status:done] Provider integration in scene_generate_speech tool
      covers: D4@1
      changes: src/service/tools/scene-generate-speech.ts (+40 -13)
- [x] T005 [agent] [status:done] Provider and local voice presets integration in TTS dialog UI
      covers: D5@1
      changes: src/editor/dialogs/tts-dialog.tsx (+129 -29), src/service/tts/preferences.ts (+3 -0)
- [x] T006 [agent] [status:done] Unit tests for pluggable providers, local adapter, config, and factory
      covers: R1@1, R2@1, R3@1, R4@1, R5@1, R6@1
      kind: test
      changes: src/service/tts/pluggable-tts.test.ts (+222 -0), test-root/assets/0c92bddb4e96f3ea.mp3 (binary)
