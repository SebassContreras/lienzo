import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { type ToolHarness, toolHarness } from "../../../test/tool-harness.ts";
import { createCtx } from "../../core/ctx.ts";
import { fakeRenderer } from "../fake-renderer.ts";

let h: ToolHarness;

beforeEach(async () => {
  h = await toolHarness();
});

const call = (name: string, input: unknown) => h.call(name, input);

const ok = (name: string, input: unknown) => h.ok(name, input);

describe("scene_preview out", () => {
  const exports = () => join(h.ctx.root, "projects", "mi-proyecto", "exports");

  it("saves the PNG inside exports/ and returns its path", async () => {
    await ok("scene_create", { scene: "demo" });

    const res = await ok("scene_preview", { scene: "demo", out: "look.png" });

    expect(res.file).toBe(join(exports(), "look.png"));
    await expect(readFile(res.file as string)).resolves.toBeDefined();
  });

  it("rejects an `out` outside exports/ and writes nothing", async () => {
    await ok("scene_create", { scene: "demo" });

    const r = await call("scene_preview", { scene: "demo", out: "../x.png" });

    expect(r.ok ? undefined : r.error).toMatchObject({
      code: "out_of_project",
      path: "out",
    });
    expect(
      existsSync(join(h.ctx.root, "projects", "mi-proyecto", "x.png")),
    ).toBe(false);
  });

  it("writes nothing without `out`", async () => {
    await ok("scene_create", { scene: "demo" });

    const res = await ok("scene_preview", { scene: "demo" });

    expect(res.file).toBeUndefined();
    expect(existsSync(exports())).toBe(false);
  });
});

describe("scene_export", () => {
  it("writes inside the project's exports/ and rejects an `out` outside it (046/R2)", async () => {
    const exports = join(h.ctx.root, "projects", "mi-proyecto", "exports");
    await ok("scene_create", { scene: "demo" });
    const png = await ok("scene_export", { scene: "demo", format: "png" });
    expect(png.file).toBe(join(exports, "demo.png"));
    expect(png.notices).toEqual([]);
    const gif = await ok("scene_export", {
      scene: "demo",
      format: "gif",
      out: "out/post.gif",
    });
    expect(gif.file).toBe(join(exports, "out", "post.gif"));
    await expect(readFile(gif.file as string)).resolves.toHaveLength(
      gif.bytes as number,
    );
    for (const out of ["../escape.png", "../../../root.png", h.ctx.root]) {
      const r = await call("scene_export", {
        scene: "demo",
        format: "png",
        out,
      });
      expect(r.ok ? undefined : r.error).toMatchObject({
        code: "out_of_project",
        path: "out",
      });
    }
  });

  it("falls back to WebM, and says so, when H.264 is unavailable", async () => {
    h.ctx = createCtx(h.ctx.root, fakeRenderer("video/webm"));
    await ok("scene_create", { scene: "demo" });
    const r = await ok("scene_export", {
      scene: "demo",
      format: "mp4",
      out: "clip.mp4",
    });
    expect(r.file).toBe(
      join(h.ctx.root, "projects", "mi-proyecto", "exports", "clip.webm"),
    );
    expect(r.type).toBe("video/webm");
    expect(r.notices).toHaveLength(1);
  });
});
