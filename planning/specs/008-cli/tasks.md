# 008 — cli — Tasks

- [x] T001 [agent] [status:done] Generic CLI adapter: flags and `--json` to tool input, JSON result, stderr and exit code on error
      covers: D1@2, A20@2
      changes: none
- [x] T002 [agent] [status:done] Generated help for the tool list and for each tool
      covers: D2@1
      changes: none
- [x] T003 [agent] [status:done] `lienzo` pnpm script running the CLI with `tsx`
      covers: D1@2, A22@1
      changes: package.json (+3 -1), pnpm-lock.yaml (+295 -11), pnpm-workspace.yaml (+2 -0), public/fonts/inter-latin-700-normal.woff (binary), src/cli/args.ts (+117 -0), src/cli/cli.test.ts (+152 -0), src/cli/help.ts (+49 -0), src/cli/main.ts (+78 -0), src/components/three/font.ts (+6 -3)
- [x] T004 [agent] [status:done] Test: every registry tool is callable from the CLI; help lists them; errors exit 1
      covers: R1@1, R2@1, R3@1
      kind: test
      changes: none
