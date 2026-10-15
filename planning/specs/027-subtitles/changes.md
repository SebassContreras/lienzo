# 027 — subtitles — Changes

## 2026-10-15 — fix subtitles canvas positioning inside bounding box
Why: The subtitle text and background pill were rendered using a double-offset relative to el.x/el.y inside withTransform, causing a misalignment between the canvas selection box and the rendered text.
- MODIFIED D2@1 → D2@2
- Tasks: T009
