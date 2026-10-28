import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { KINDS } from "./index.ts";

describe("docs/components.md", () => {
  it("has a section for every registered kind", () => {
    const doc = readFileSync("docs/components.md", "utf8");
    const missing = KINDS.filter((k) => !doc.includes(`## \`${k}\``));
    expect(missing).toEqual([]);
  });
});
