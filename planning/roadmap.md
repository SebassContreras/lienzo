# Roadmap

Specs in order. `Status` is written by the pre-commit hook from each spec's checkboxes. Specs 001–064 not listed were finished under the old spectrace format (one folder per spec); they live in git history.

| ID  | Spec | Status | Depends on |
|-----|------|--------|------------|
| 050 | joint-mode | done | — |
| 065 | defaults-and-easing-notices | todo | — |
| 066 | lazy-vendor-chunks | in progress | — |

## Ideas

Anything worth doing later.

- The `icon` drawing code (`src/engine/icon-shapes.ts`) imports the whole `lucide` set (~900 kB source) into the startup chunk; load it on demand (found in 066).
