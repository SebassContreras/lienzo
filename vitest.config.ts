import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/types/**"],
      reporter: ["text-summary", "json-summary"],
      reportsDirectory: "reports/coverage",
      // The floor of each folder (082/T041): its coverage when the suite was rewritten, less a
      // point. Raise one when its tests grow; never lower one to let a change through.
      thresholds: {
        "src/animations/**": { lines: 99, branches: 99 },
        "src/cli/**": { lines: 82, branches: 81 },
        "src/components/**": { lines: 84, branches: 68 },
        "src/editor/**": { lines: 34, branches: 30 },
        "src/engine/**": { lines: 84, branches: 72 },
        "src/export/**": { lines: 97, branches: 92 },
        "src/mcp/**": { lines: 67, branches: 76 },
        "src/model/**": { lines: 97, branches: 89 },
        "src/presets/**": { lines: 84, branches: 75 },
        "src/service/**": { lines: 89, branches: 80 },
        "src/traits/**": { lines: 84, branches: 99 },
      },
    },
  },
});
