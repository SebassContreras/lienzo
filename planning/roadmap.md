# Roadmap

Specs in order. `Status` is written by the pre-commit hook from each spec's checkboxes. Specs 001–064 not listed were finished under the old spectrace format (one folder per spec); they live in git history.

| ID  | Spec | Status | Depends on |
|-----|------|--------|------------|
| 050 | joint-mode | done | — |
| 065 | defaults-and-easing-notices | done | — |
| 066 | lazy-vendor-chunks | done        | — |
| 067 | tool-feedback-fixes | done | — |
| 068 | qa-feedback-fixes | done        | — |
| 069 | qa-suite-fixes | done        | — |
| 070 | qa-suite-audit | done        | 069 |
| 071 | qa-round-3-fixes | done        | 069 |
| 072 | qa-round-4-fixes | done        | 071 |
| 073 | qa-round-5-fixes | done | 072 |
| 074 | qa-round-6-root-causes | done        | 073 |
| 075 | shot-timing-and-full-validation | done        | 074 |
| 076 | bundle-root-and-input-hints | done        | 075 |
| 077 | docs-and-descriptions-audit | done        | 076 |
| 078 | qa-round-7-fixes | done        | 077 |
| 079 | descriptions-after-078 | done        | 078 |
| 080 | qa-round-8-every-writer | done        | 079 |
| 081 | qa-round-9-input-gaps | done        | 080 |
| 082 | test-suite-rewrite | done        | 081 |
| 083 | one-validate-verdict | done        | 082 |
| 084 | id-charset | done        | 082 |

## Ideas

Anything worth doing later. (The two earlier ideas are specs 083 and 084.)

- `shape_overlap` fires only when two boxes cover half of the smaller one (`shapesStack`), so
  two composites (chart, table, steps, list) that overlap by a third pass clean though their
  text collides. Decide whether a composite kind gets a lower threshold, or the check also
  compares what each draws (`text-extents.ts`). (QA 2026-10-29)
- `scene_inspect_layout` boxes at t=0 are `w: 0` / `h: 0` for an `in` animation that starts at
  scale 0, which reads as a layout fault. Mark the box as animating, or also return its resting
  box. (QA 2026-10-29)
