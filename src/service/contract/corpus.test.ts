/**
 * The replay corpus (082/R8) in Vitest: each case of `corpus/*.json` runs in a sandbox of its
 * own, and the runner itself is checked on a case that passes and one that does not.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { type Case, loadCorpus, runCase } from "./corpus.ts";
import { type Sandbox, sandbox } from "./harness.ts";

vi.setConfig({ testTimeout: 30_000 });

let box: Sandbox | undefined;
afterEach(async () => {
  await box?.ctx.dispose?.();
  box = undefined;
});

const corpus = loadCorpus();

describe("the replay corpus", () => {
  it("has a distinct id for each case and names its source", () => {
    const ids = corpus.map((c) => c.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(corpus.filter((c) => !c.source)).toEqual([]);
  });

  it.each(corpus.map((c) => [`${c.id} (${c.source})`, c] as const))(
    "%s",
    async (_title, c) => {
      box = await sandbox();

      expect(await runCase(box.ctx, c)).toEqual([]);
    },
  );
});

describe("the corpus runner", () => {
  const unknownScene: Case = {
    id: "t1",
    source: "test",
    call: { tool: "scene_get", input: { scene: "nope" } },
    expect: { code: "not_found", path: "scene" },
  };

  it("passes a case whose expectations hold", async () => {
    box = await sandbox();

    expect(await runCase(box.ctx, unknownScene)).toEqual([]);
  });

  it("lists what did not hold, one line each", async () => {
    box = await sandbox();
    const wrong: Case = {
      ...unknownScene,
      expect: { ok: true, code: "other", message: "zzz" },
    };

    const problems = await runCase(box.ctx, wrong);

    expect(problems).toEqual([
      "answered with an error",
      expect.stringContaining("wanted other"),
      expect.stringContaining("does not match zzz"),
    ]);
  });

  it("stops at a setup call that fails and says which", async () => {
    box = await sandbox();
    const broken: Case = {
      ...unknownScene,
      setup: [{ tool: "scene_delete", input: { scene: "nope" } }],
    };

    expect(await runCase(box.ctx, broken)).toEqual([
      expect.stringContaining("setup scene_delete failed"),
    ]);
  });
});
