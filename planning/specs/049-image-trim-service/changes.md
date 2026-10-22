# 049 — image-trim-service — Changes

## 2026-10-22 — wording: probe signature and shared page session
Why: the probe takes the URL the page loads (the tool resolves project assets), so it needs no `project`; the lazy page session is the renderer's, extracted as `lazyRenderPage` instead of a second copy (DRY). Same decisions.
- REWORDED D1@1, D2@1
- Tasks: none
