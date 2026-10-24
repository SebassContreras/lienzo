# 061 — audit-docs-and-tts-cleanup — Changes

## 2026-10-24 — spec created from the audit
Why: the audit in `audit.md`; the owner chose to drop the legacy key slot, retire the
pre-012 schema, write `.env.example` in English and move the component list out of README.
- ADDED R1@1–R7@1, D1@1–D7@1
- Tasks: T001–T010

## 2026-10-24 — real cause of the failing test run
Why: reproduced in 1 of 4 runs; the cause was a teardown hook timeout, not an unhandled error.
- MODIFIED D7@1 → D7@2
- Tasks: T009 re-pointed to D7@2 (still valid)
