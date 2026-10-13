# Roadmap

Index of every spec. `Status` and `Stage` are written only by `trace`. Grammar:
`.spectrace/format.md`.

| ID  | Spec | Status | Depends on | Stage | Priority |
|-----|------|--------|------------|-------|----------|
| 001 | editor-base | done        | — | —     | 1 |
| 002 | more-components | done        | 001 | —     | 3 |
| 003 | presets-scenes | done        | 001 | —     | 4 |
| 004 | preset-traits | done        | 001 | —     | 2 |
| 005 | particles | done        | 001, 004, 006 | —     | 6 |
| 006 | background-presets | done        | 004 | —     | 5 |
| 007 | service-layer | done | 003, 004, 005, 012, 015 | —     | 16 |
| 008 | cli | done        | 007 | —     | 17 |
| 009 | mcp-server | done        | 007, 008 | —     | 18 |
| 010 | headless-export | done        | 007, 008, 009 | —     | 19 |
| 011 | compact-scenes | done        | 007, 012, 013, 014, 015, 018, 019 | —     | 15 |
| 012 | component-registry | done        | 001, 002, 005 | —     | 7 |
| 013 | animation-playback | done        | 012 | —     | 8 |
| 014 | particle-template | done        | 012, 013 | —     | 10 |
| 015 | keyframes-timeline | done        | 012, 013 | —     | 11 |
| 016 | three-d | done | 012, 013, 015 | —     | 14 |
| 017 | more-elements | done | 012, 013, 015 | —     | 13 |
| 018 | more-animations | done        | 012, 013 | —     | 9 |
| 019 | animation-presets | done        | 003, 013, 015, 018 | —     | 12 |
| 020 | history-undo | done | 001 | —      | 20 |
| 021 | smart-connectors | done | 001, 012, 020 | —      | 21 |
| 022 | canvas-alignment | done | 001, 012, 020 | —      | 22 |
| 023 | mcp-visual-feedback | done        | 007 | —      | 23 |
| 024 | free-path | done | 012, 013, 015 | —     | 24 |
| 025 | effects | todo | 012, 013, 015, 017 | build | 25 |
