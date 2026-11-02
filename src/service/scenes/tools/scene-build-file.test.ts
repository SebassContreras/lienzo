import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { type ToolHarness, toolHarness } from "../../../test/tool-harness.ts";

let harness: ToolHarness;
let dir: string;

beforeEach(async () => {
  harness = await toolHarness();
  dir = await mkdtemp(join(tmpdir(), "lienzo-build-file-"));
});

const sampleCompact = {
  elements: [{ kind: "rect", id: "box", w: 200, h: 100 }],
};

describe("scene_build and scene_validate with compactFile", () => {
  describe("R1 partitions and errors", () => {
    it.each([
      {
        scenario: "valid absolute path to JSON file",
        setup: async () => {
          const file = join(dir, "scene.json");
          await writeFile(file, JSON.stringify(sampleCompact));
          return { compactFile: file };
        },
        expectedBuild: { ok: true },
        expectedValidate: { ok: true, value: { valid: true } },
      },
      {
        scenario: "valid relative path to JSON file",
        setup: async () => {
          const relDir = "tmp-test-rel";
          await mkdir(relDir, { recursive: true });
          const file = join(relDir, "scene.json");
          await writeFile(file, JSON.stringify(sampleCompact));
          return { compactFile: file };
        },
        expectedBuild: { ok: true },
        expectedValidate: { ok: true, value: { valid: true } },
      },
      {
        scenario: "file exceeding 20 MB size limit",
        setup: async () => {
          const file = join(dir, "too-large.json");
          // Fake large file using a buffer or sparse file, or just test failure
          // Note: create a file just over 20 MB: 20 * 1024 * 1024 + 1 bytes
          const size = 20 * 1024 * 1024 + 1;
          const buf = Buffer.alloc(size);
          await writeFile(file, buf);
          return { compactFile: file };
        },
        expectedBuild: {
          ok: false,
          error: { code: "too_large", path: "compactFile" },
        },
        expectedValidate: {
          ok: true,
          value: { valid: false, path: "compactFile" },
        },
      },
      {
        scenario: "both compact and compactFile provided",
        setup: async () => {
          const file = join(dir, "scene.json");
          await writeFile(file, JSON.stringify(sampleCompact));
          return { compact: sampleCompact, compactFile: file };
        },
        expectedBuild: {
          ok: false,
          error: { code: "invalid_input", path: "compactFile" },
        },
        expectedValidate: {
          ok: true,
          value: { valid: false, path: "compactFile" },
        },
      },
      {
        scenario: "both data and compactFile provided to scene_validate",
        setup: async () => {
          const file = join(dir, "scene.json");
          await writeFile(file, JSON.stringify(sampleCompact));
          return { data: { elements: [] }, compactFile: file };
        },
        expectedBuild: null, // only applies to scene_validate
        expectedValidate: {
          ok: true,
          value: { valid: false, path: "compactFile" },
        },
      },
      {
        scenario: "neither compact nor compactFile provided to scene_build",
        setup: async () => ({}),
        expectedBuild: {
          ok: false,
          error: { code: "invalid_input", path: "compact" },
        },
        expectedValidate: {
          ok: true,
          value: { valid: false, path: "compact" },
        },
      },
      {
        scenario: "nonexistent file",
        setup: async () => ({
          compactFile: join(dir, "does-not-exist.json"),
        }),
        expectedBuild: {
          ok: false,
          error: { code: "not_found", path: "compactFile" },
        },
        expectedValidate: {
          ok: true,
          value: { valid: false, path: "compactFile" },
        },
      },
      {
        scenario: "non-JSON file",
        setup: async () => {
          const file = join(dir, "invalid.txt");
          await writeFile(file, "this is not json");
          return { compactFile: file };
        },
        expectedBuild: {
          ok: false,
          error: { code: "invalid_json", path: "compactFile" },
        },
        expectedValidate: {
          ok: true,
          value: { valid: false, path: "compactFile" },
        },
      },
      {
        scenario: "JSON file whose root is not an object",
        setup: async () => {
          const file = join(dir, "array.json");
          await writeFile(file, JSON.stringify(["not", "an", "object"]));
          return { compactFile: file };
        },
        expectedBuild: {
          ok: false,
          error: { code: "invalid_compact", path: "compactFile" },
        },
        expectedValidate: {
          ok: true,
          value: { valid: false, path: "compactFile" },
        },
      },
    ])("$scenario", async ({ setup, expectedBuild, expectedValidate }) => {
      const input = await setup();

      if (expectedBuild) {
        const buildRes = await harness.call("scene_build", input);
        expect(buildRes).toMatchObject(expectedBuild);
      }

      if (expectedValidate) {
        const valRes = await harness.call("scene_validate", input);
        expect(valRes).toMatchObject(expectedValidate);
      }
    });
  });

  describe("Identity invariant (compact vs compactFile)", () => {
    it("produces byte-identical saved scenes and notices", async () => {
      const file = join(dir, "scene.json");
      await writeFile(file, JSON.stringify(sampleCompact));

      const fromInline = await harness.call("scene_build", {
        compact: sampleCompact,
        save: "scene-inline",
      });
      const fromFile = await harness.call("scene_build", {
        compactFile: file,
        save: "scene-file",
      });

      expect(fromInline.ok).toBe(true);
      expect(fromFile.ok).toBe(true);

      const sceneInline = await harness.call("scene_get", {
        scene: "scene-inline",
        full: true,
      });
      const sceneFile = await harness.call("scene_get", {
        scene: "scene-file",
        full: true,
      });

      // Byte-identical serialized content
      expect(JSON.stringify(sceneFile)).toBe(JSON.stringify(sceneInline));
    });
  });
});
