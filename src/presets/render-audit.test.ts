import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { KINDS } from "../components/index.ts";
import type { Ctx } from "../engine/paint.ts";
import { drawScene } from "../engine/render.ts";
import { defaultElement, defaultScene, type Element } from "../model/model.ts";
import type { PresetRecipe } from "../model/preset.ts";
import { installCanvasFakes, RecordingCtx } from "../test/recording-ctx.ts";
import { resolvePreset } from "./resolve.ts";

installCanvasFakes();

const BUILT_IN = "presets/built-in";
const presetFiles = readdirSync(BUILT_IN).filter((f) => f.endsWith(".json"));

/** A short fingerprint of every draw call: equal fingerprints mean equal pixels. */
function renderFingerprint(el: Element): string {
  const ctx = new RecordingCtx();
  drawScene(ctx as unknown as Ctx, { ...defaultScene(), elements: [el] }, 1);
  return createHash("sha1")
    .update(ctx.log.join("\n"))
    .digest("hex")
    .slice(0, 12);
}

function presetElement(file: string): Element | undefined {
  const recipe = JSON.parse(
    readFileSync(`${BUILT_IN}/${file}`, "utf8"),
  ) as PresetRecipe;
  const resolved = resolvePreset(recipe);
  return "element" in resolved ? resolved.element : undefined;
}

/**
 * Render audit (063/R10): a change in how a built-in preset or a default element looks shows
 * up as a snapshot diff, so look changes are always deliberate (update with `-u`).
 */
describe("render audit (063/R10)", () => {
  it.each(presetFiles)("built-in preset %s renders as recorded", (file) => {
    // Arrange
    const el = presetElement(file);

    // Act
    const fingerprint = el ? renderFingerprint(el) : "background";

    // Assert
    expect(fingerprint).toMatchSnapshot();
  });

  it.each([...KINDS])("default %s element renders as recorded", (kind) => {
    // Arrange
    const el = defaultElement(kind);

    // Act
    const fingerprint = renderFingerprint(el);

    // Assert
    expect(fingerprint).toMatchSnapshot();
  });
});
