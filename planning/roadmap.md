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
| 007 | service-layer | todo | 003, 004, 005, 012, 015 | build | 16 |
| 008 | cli | todo | 007 | build | 17 |
| 009 | mcp-server | todo | 007, 008 | build | 18 |
| 010 | headless-export | todo | 007, 008, 009 | build | 19 |
| 011 | compact-scenes | todo | 012, 013, 014, 015, 016, 017, 018, 019, 007 | build | 15 |
| 012 | component-registry | in_progress | 001, 002, 005 | build | 7 |
| 013 | animation-playback | todo | 012 | build | 8 |
| 014 | particle-template | todo | 012, 013 | build | 10 |
| 015 | keyframes-timeline | todo | 012, 013 | build | 11 |
| 016 | three-d | todo | 012, 013, 015 | build | 14 |
| 017 | more-elements | todo | 012, 013, 015 | build | 13 |
| 018 | more-animations | todo | 012, 013 | build | 9 |
| 019 | animation-presets | todo | 003, 013, 015, 018 | build | 12 |
