# 036 — subtitles-speech-sync — Changes

## 2026-10-17 — Simplificación de sincronización de subtítulos
Why: Se eliminó la sobreingeniería de ajuste automático al audio y desplazamientos por cue. Solo se necesita cuándo empieza (startOffset) y la velocidad (speed).
- MODIFIED R1@1 → R1@2
- REMOVED R3@1
- REMOVED R4@1
- MODIFIED D1@1 → D1@2
- REMOVED D2@1
- MODIFIED D3@1 → D3@2
- Tasks: T007, T008

## 2026-10-17 — Compatibilidad de pausas de voz y gaps entre palabras
Why: Permitir pausas explícitas entre palabras (ej. [0.5s]) en el texto para sincronizar con silencios del audio y mantener compatibilidad bidireccional con VTT/SRT/Whisper importados.
- MODIFIED R1@2 → R1@3
- ADDED R6@1
- MODIFIED D3@2 → D3@3
- ADDED D5@1
- Tasks: T009, T010, T011

