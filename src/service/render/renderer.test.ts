/**
 * 010/T004 in a real headless browser: the demo scene through `scene_export` as PNG, GIF and
 * MP4, and the PNG checked byte for byte against the editor's own export at the same t (R3).
 * Skipped where no Chrome, Edge or Playwright Chromium is installed.
 */
import { execFile, spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { chromium } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Scene } from "../../model/model.ts";
import { type Ctx, createCtx } from "../core/ctx.ts";
import { findAppRoot } from "../projects/root.ts";
import { registry } from "../tools/index.ts";
import { type AppSession, closeApp, openApp } from "./renderer.ts";

const APP_ROOT = findAppRoot(import.meta.dirname);

async function hasBrowser(): Promise<boolean> {
  for (const channel of ["chrome", "msedge", undefined]) {
    const b = await chromium.launch({ channel }).catch(() => undefined);
    if (b) {
      await b.close();
      return true;
    }
  }
  return false;
}

const browser = await hasBrowser();

describe.skipIf(!browser)("headless export (010)", { timeout: 180_000 }, () => {
  let ctx: Ctx;
  let editor: AppSession;
  let demo: Scene;

  beforeAll(async () => {
    const root = await mkdtemp(join(tmpdir(), "lienzo-render-"));
    await cp("presets/built-in", join(root, "presets", "built-in"), {
      recursive: true,
    });
    await mkdir(join(root, "presets", "animations"), { recursive: true });
    ctx = createCtx(root);
    await registry.call("project_create", { project: "p", name: "P" }, ctx);
    editor = await openApp(APP_ROOT, "");
    demo = (await inPage(
      `(await import("/src/test/fixtures/sample-scene.ts")).demoScene()`,
    )) as Scene;
    const r = await registry.call(
      "scene_create",
      { scene: "demo", project: "p", data: demo },
      ctx,
    );
    expect(r.ok).toBe(true);
  }, 180_000);

  afterAll(async () => {
    await ctx?.dispose();
    if (editor) await closeApp(editor);
  }, 60_000);

  /**
   * Runs `body` (an async function body, or one expression) in the editor page. A string,
   * because Vitest would rewrite an `import()` written in a function here.
   */
  const inPage = (body: string) =>
    editor.page.evaluate(
      `(async () => { ${body.includes("return") ? body : `return ${body}`} })()`,
    );

  async function exported(input: Record<string, unknown>) {
    const r = await registry.call(
      "scene_export",
      { scene: "demo", project: "p", ...input },
      ctx,
    );
    if (!r.ok) throw new Error(JSON.stringify(r.error));
    const value = r.value as { file: string; type: string; notices: string[] };
    return { ...value, bytes: await readFile(value.file) };
  }

  it("exports PNG, GIF and MP4 (or WebM, with a notice) (R1)", async () => {
    const png = await exported({ format: "png", t: 1 });
    expect(png.type).toBe("image/png");
    expect(png.bytes.subarray(1, 4).toString()).toBe("PNG");
    const gif = await exported({ format: "gif", scale: 0.25 });
    expect(gif.bytes.subarray(0, 6).toString()).toBe("GIF89a");
    const video = await exported({ format: "mp4", scale: 0.25 });
    if (video.type === "video/mp4") {
      expect(video.file.endsWith(".mp4")).toBe(true);
      expect(video.bytes.subarray(4, 8).toString()).toBe("ftyp");
    } else {
      expect(video.type).toBe("video/webm");
      expect(video.notices).toHaveLength(1);
    }
  });

  it("previews a PNG as image data (R2)", async () => {
    const r = await registry.call(
      "scene_preview",
      { scene: "demo", project: "p", t: 1 },
      ctx,
    );
    if (!r.ok) throw new Error(JSON.stringify(r.error));
    const { image } = r.value as { image: { data: string } };
    expect(Buffer.from(image.data, "base64").subarray(1, 4).toString()).toBe(
      "PNG",
    );
  });

  it("writes the same PNG as the editor's export at the same t (R3)", async () => {
    const t = 1.5;
    const tool = await exported({ format: "png", t });
    // What the editor's PNG button calls, with its options (scale 1, scene fps).
    const fromEditor = (await inPage(`
      const scene = ${JSON.stringify(demo)};
      const { exportScene } = await import("/src/export/export.ts");
      const blob = await exportScene(
        scene,
        { format: "png", scale: 1, fps: scene.fps, time: ${t} },
        () => {},
      );
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    `)) as number[];
    expect(tool.bytes.equals(Buffer.from(fromEditor))).toBe(true);
  });
});

/** `pnpm lienzo …` as its own process; rejects if it does not exit by itself in time. */
const lienzo = (args: string[]) =>
  promisify(execFile)(
    process.execPath,
    ["--import", "tsx", "src/cli/main.ts", ...args],
    { cwd: APP_ROOT, timeout: 90_000 },
  ).then(
    () => 0,
    (error: { code?: number; killed?: boolean }) => {
      if (error.killed) throw new Error("the CLI did not exit by itself");
      return error.code ?? 1;
    },
  );

describe.skipIf(!browser)(
  "the renderer does not outlive its process (010/D4)",
  { timeout: 120_000 },
  () => {
    // The CLI runs on the repo; the example scene lives in a throwaway, git-ignored project.
    const project = "tmp-renderer-exit";
    const projectDir = join(APP_ROOT, "projects", project);
    beforeAll(async () => {
      await mkdir(join(projectDir, "scenes"), { recursive: true });
      await writeFile(
        join(projectDir, "project.json"),
        JSON.stringify({
          name: "Temporal",
          slug: project,
          createdAt: "2026-10-22T00:00:00.000Z",
        }),
      );
      await cp(
        join(APP_ROOT, "src", "test", "fixtures", "ejemplo-keyframes.json"),
        join(projectDir, "scenes", "ejemplo-keyframes.json"),
      );
    });
    afterAll(() => rm(projectDir, { recursive: true, force: true }));

    it("exits after an export, and after a failed one", async () => {
      const scene = [
        "scene_export",
        "--scene",
        "ejemplo-keyframes",
        "--project",
        project,
        "--format",
        "png",
      ];
      expect(await lienzo([...scene, "--out", "ok.png"])).toBe(0);
      // `out` under a file: the render succeeds, then writing fails.
      await writeFile(join(projectDir, "exports", "file"), "");
      expect(await lienzo([...scene, "--out", "file/x.png"])).toBe(1);
    });

    it("the MCP server exits once the client closes stdin, after a preview", async () => {
      const child = spawn(
        process.execPath,
        ["--import", "tsx", "src/cli/main.ts", "mcp"],
        {
          cwd: APP_ROOT,
        },
      );
      const send = (msg: object) =>
        child.stdin.write(`${JSON.stringify(msg)}
`);
      const answered = new Promise<void>((resolve) => {
        let out = "";
        child.stdout.on("data", (chunk: Buffer) => {
          out += chunk.toString();
          if (out.includes('"id":2')) resolve();
        });
      });
      const exited = new Promise<number | null>((resolve) =>
        child.on("exit", resolve),
      );
      send({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "t", version: "0" },
        },
      });
      send({ jsonrpc: "2.0", method: "notifications/initialized" });
      send({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "scene_preview",
          arguments: { scene: "ejemplo-keyframes", project },
        },
      });
      await answered;
      child.stdin.end();
      const timer = setTimeout(() => child.kill(), 30_000);
      expect(await exited).toBe(0);
      clearTimeout(timer);
    });
  },
);
