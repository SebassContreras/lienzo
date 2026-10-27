import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { APP_ROOT } from "./ctx.ts";
import { findAppRoot } from "./root.ts";

it("finds the app with vite.config.ts from the CLI bundle's folder (076/R1)", () => {
  const fromBundle = findAppRoot(join(APP_ROOT, "dist"));

  expect(fromBundle).toBe(APP_ROOT);
  expect(existsSync(join(fromBundle, "vite.config.ts"))).toBe(true);
});

it("finds the same app from the source folder (076/R1)", () => {
  expect(findAppRoot(join(APP_ROOT, "src", "service"))).toBe(APP_ROOT);
});
