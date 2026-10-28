import { defineConfig } from "vitest/config";

// What Stryker runs (082/D2): the unit and contract suites, not the headless-browser one,
// which times out inside a mutation run.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["**/node_modules/**", "src/service/renderer.test.ts"],
    passWithNoTests: true,
  },
});
