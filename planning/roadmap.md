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
| 082 | test-suite-rewrite | in progress | 081 |

## Ideas

Anything worth doing later.
- `scene_validate` answers a failure in two shapes: with `compact`, an expansion problem is an error (`ok: false`) and a rule problem a verdict (`ok: true, valid: false`); with `data` every problem is a verdict. Worth one shape (082, QA log).
- Shot and element id charset: ids are free text today (`"Bad Id!"` is stored); revisit if a tool needs ids as paths with spaces (081, Not doing).
