import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { createCtx, type ProjectCtx } from "../core/ctx.ts";
import { writeExport } from "./exports.ts";
import { fakeRenderer } from "./fake-renderer.ts";

let ctx: ProjectCtx;
let exportsDir: string;

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-exports-"));
  ctx = { ...createCtx(root, fakeRenderer()), project: "p" } as ProjectCtx;
  exportsDir = join(root, "projects", "p", "exports");
});

describe("writeExport (046/D2, 058/D6)", () => {
  it("writes inside the project's exports/ with the real extension", async () => {
    const file = await writeExport(
      ctx,
      "sub/clip.mp4",
      new Uint8Array([1, 2]),
      "webm",
    );

    expect(file).toBe(join(exportsDir, "sub", "clip.webm"));
    await expect(readFile(file)).resolves.toHaveLength(2);
  });

  it("rejects a path that leaves exports/", async () => {
    await expect(
      writeExport(ctx, "../escape.png", new Uint8Array([1]), "png"),
    ).rejects.toMatchObject({ error: { code: "out_of_project", path: "out" } });
  });

  it("rejects an absolute path outside exports/", async () => {
    await expect(
      writeExport(ctx, ctx.root, new Uint8Array([1]), "png"),
    ).rejects.toMatchObject({ error: { code: "out_of_project" } });
  });
});
