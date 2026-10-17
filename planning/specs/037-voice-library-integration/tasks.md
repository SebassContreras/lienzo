- [x] T001 [agent] [status:done] Voice preset domain model, Zod schema, and parser in `src/model/voice-preset.ts`
      covers: D3@1, R4@1
      changes: src/model/voice-preset.ts (+38 -0)
- [x] T002 [agent] [status:done] Unit tests for voice preset schema validation and serialization
      covers: D3@1, R4@1
      kind: test
      changes: src/model/voice-preset.test.ts (+56 -0)
- [x] T003 [agent] [status:done] Built-in voice preset JSON recipe under "Voces" category with store loading
      covers: D3@1, D4@1, R4@1, R5@1
      changes: presets/voices/01-locutor-espanol.json (+11 -0), src/presets/store.ts (+34 -0), vite.config.ts (+1 -0)
- [x] T004 [agent] [status:done] "Voz con IA" action button in basic elements toolbar and library UI
      covers: D1@1, R1@1, R2@1
      changes: src/editor/app.tsx (+33 -2), src/editor/dialogs/tts-dialog.tsx (+97 -16), src/editor/library.tsx (+20 -1)
- [x] T005 [agent] [status:done] Save voice preset action in TTS dialog and voice preset application handler in editor
      covers: D4@1, D5@1, R2@1, R4@1, R5@1
      changes: src/editor/app.tsx (+16 -0), src/editor/voice-library.tsx (+187 -0), src/presets/store.ts (+1 -1)
- [x] T006 [agent] [status:done] Verification tests for voice library integration, preset application, and unversioned audio asset attachment
      covers: D2@1, D4@1, R3@1, R5@1
      kind: test
      changes: src/editor/voice-library.test.ts (+62 -0)
- [x] T007 [agent] [status:done] Remove "Voz con IA" action button from basic elements toolbar
      covers: D6@1, R2@2
      retires: T004
      changes: src/editor/app.tsx (+2 -12)
- [x] T008 [agent] [status:done] Remove VoiceLibrary panel and presets/voices category from sidebar
      covers: D6@1, R2@2
      retires: T005
      changes: src/editor/app.tsx (+0 -18), src/editor/voice-library.tsx (+0 -201)
- [x] T009 [agent] [status:done] Verification tests for topbar AI voice button and unversioned audio generation
      covers: D2@1, D6@1, R2@2, R3@1
      kind: test
      retires: T006
      changes: src/editor/voice-library.test.ts (+3 -42)
- [x] T010 [agent] [status:done] Remove unused voice presets storage and schema artifacts
      covers: D6@1, R2@2
      retires: T001, T002, T003
      changes: presets/voices/01-locutor-espanol.json (+0 -11), src/editor/dialogs/tts-dialog.tsx (+3 -37)

