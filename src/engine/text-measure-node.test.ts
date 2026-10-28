import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { loadFontSync, measureWithOpentype } from "./text-measure.ts";

/** Measures in a plain Node ESM process, as the CLI and the MCP server run, not under Vitest. */
function measureInPlainNode(text: string): number {
  const script = `
    const { measureTextWidth } = await import("./src/engine/text-measure.ts");
    console.log(measureTextWidth(${JSON.stringify(text)}, { font: "Inter", size: 64, weight: 700 }));
  `;
  const out = execFileSync(
    "node",
    ["--experimental-strip-types", "--input-type=module", "-e", script],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
  return Number(out.trim());
}

describe("text measurement outside Vitest", () => {
  it("measures a bundled font with its glyph metrics in plain Node", () => {
    // Arrange
    const text = "Automatiza tus envíos hoy";
    const font = loadFontSync("Inter", 700);
    const glyphWidth = measureWithOpentype(font as never, text, 64);

    // Act
    const width = measureInPlainNode(text);

    // Assert
    expect(width).toBeCloseTo(glyphWidth, 0);
  });
});
