import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generateCompactJsonSchema } from "./compact.ts";

describe("schemas/compact-scene.json", () => {
  it("is what the descriptors generate", () => {
    const committed = JSON.parse(
      readFileSync("schemas/compact-scene.json", "utf8"),
    );
    expect(committed).toEqual(generateCompactJsonSchema());
  });
});
