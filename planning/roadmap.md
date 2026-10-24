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
| 007 | service-layer | done        | 003, 004, 005, 012, 015 | —     | 16 |
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
| 025 | effects | done        | 012, 013, 015, 017 | —     | 25 |
| 026 | audio-track | done        | 001, 007, 010 | —      | 26 |
| 027 | subtitles | done        | 012, 013, 015 | —      | 27 |
| 028 | voice-tts | done        | 026, 027 | —      | 28 |
| 029 | cli-mcp-distribution | done        | 008, 009 | —            | 29 |
| 030 | dynamic-tts-config | done        | 028 | —      | 30 |
| 031 | project-workspaces | done        | 003, 007, 008, 009 | —      | 31 |
| 032 | pluggable-tts-providers | done        | 028, 030 | —      | 32 |
| 033 | project-modes-static-video | done        | 001, 007, 031 | —            | 33 |
| 034 | layers-panel | done        | 001, 012, 020 | —            | 34 |
| 035 | multi-audio-tracks | done        | 026, 007, 010 | —            | 35 |
| 036 | subtitles-speech-sync | done        | 027, 028 | —            | 36 |
| 037 | voice-library-integration | done        | 028, 003, 004, 035 | —            | 37 |
| 038 | web-project-brand-manager | done        | 001, 003, 007, 031 | —      | 38 |
| 039 | codebase-fixes-and-optimization | done        | 007, 009, 010, 011, 027, 028, 032 | —      | 39 |
| 040 | project-centric-storage | done        | 031, 038, 039 | —     | 40 |
| 041 | workspace-assets-presets-fixes | done        | 040 | —     | 41 |
| 042 | blank-startup | done        | 041 | —     | 42 |
| 043 | scenes-sidebar-tab | done        | 041, 042 | —     | 43 |
| 044 | nested-asset-drag | done        | 041 | —     | 44 |
| 045 | external-fonts | done        | 038, 040 | —     | 45 |
| 046 | audit-cleanup | done        | 040, 045 | —     | 46 |
| 047 | image-aspect-and-lint | done        | 044 | —     | 47 |
| 048 | image-trim | done        | 044, 047 | —     | 48 |
| 049 | image-trim-service | done        | 048 | —     | 49 |
| 050 | joint-mode | done        | 043, 049 | —      | 50 |
| 051 | nested-tools-and-validation | done        | 007, 011 | —      | 51 |
| 052 | track-loops-and-step | done        | 011, 015 | —      | 52 |
| 053 | transform-origin-and-opacity | done        | 011, 012, 013 | —      | 53 |
| 054 | text-measurement-and-box | done        | 007, 011, 012, 045 | —      | 54 |
| 055 | shots-and-camera | done        | 011, 015, 034, 053 | —      | 55 |
| 056 | reusable-symbols | todo        | 011, 012 | design | 56 |
| 057 | path-layers-and-particles | todo        | 005, 012, 024 | design | 57 |
| 058 | compact-effects-and-defaults | todo        | 010, 011, 025 | design | 58 |
| 059 | shapes-clip-and-gradients | todo        | 002, 012, 017 | design | 59 |
