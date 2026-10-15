# 027 — subtitles — Changes

## 2026-10-15 — fix subtitles canvas positioning inside bounding box
Why: The subtitle text and background pill were rendered using a double-offset relative to el.x/el.y inside withTransform, causing a misalignment between the canvas selection box and the rendered text.
- MODIFIED D2@1 → D2@2
- Tasks: T009

## 2026-10-15 — paginate subtitle cue words to fit bounding box
Why: Long subtitle cues overflowed the visual container box. Subtitle rendering now paginates words dynamically into an active window (2-4 words per line/window) synchronized with the audio playhead.
- MODIFIED R3@1 → R3@2
- MODIFIED D2@2 → D2@3
- Tasks: T010

