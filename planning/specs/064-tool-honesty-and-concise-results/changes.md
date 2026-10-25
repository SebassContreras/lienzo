# 064 — tool-honesty-and-concise-results — Changes

## 2026-10-25 — Every flat kind has a border glow
Why: T001 showed that ellipse, polygon, star and arrow share the rect fields, `borderGlow` included, so the presence check of D1 guards nothing (KISS).
- R1@1 reworded (meaning unchanged; reviewed with `trace review`)
- REMOVED D1@1
- ADDED D6@1
- Tasks: T002 re-pointed to D6@1 (not started)

## 2026-10-25 — Estimated widths are their own notice
Why: measuring in Node uses only the bundled fonts, so a font installed with `font_install` is estimated too but never reported missing; tying the notice to `fontNotices` would miss it.
- MODIFIED D3@1 → D3@2
- Tasks: T006 re-pointed to D3@2 (not started)

## 2026-10-25 — Built
Why: the new notice (R4) and the concise result (R6) change what older tests pinned exactly, so those tests now list the estimated-width notice and read the saved scene from disk instead of the reply; none was loosened.
- Tasks: T001–T010 done

## 2026-10-25 — One tool-test harness
Why: `service.test.ts` kept its own copy of the setup `tool-harness.ts` now shares.
- ADDED D7@1
- Tasks: T011
