import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { installCanvasFakes } from "./recording-ctx.ts";

installCanvasFakes();
const { goldenScenes } = await import("./golden-scenes.ts");
const { renderHashes } = await import("./render-log.ts");

/**
 * `render.golden.json` holds the hash of every canvas call made for each frame of the
 * golden scenes, recorded before the component registry (spec 012). Matching hashes mean
 * the scenes draw exactly as they did. `UPDATE_GOLDEN=1` rewrites it.
 */
const GOLDEN = new URL("./render.golden.json", import.meta.url);

describe("rendering", () => {
  const scenes = goldenScenes();
  const now = Object.fromEntries(
    Object.entries(scenes).map(([name, s]) => [name, renderHashes(s)]),
  );
  if (process.env.UPDATE_GOLDEN || !existsSync(GOLDEN)) {
    writeFileSync(GOLDEN, `${JSON.stringify(now, null, 2)}\n`);
  }
  const golden = JSON.parse(readFileSync(GOLDEN, "utf8"));

  it.each(Object.keys(scenes))("«%s» draws exactly as before", (name) => {
    expect(now[name]).toEqual(golden[name]);
  });
});
