import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { beforeEach, describe, expect, it } from "vitest";
import { type Ctx, createCtx } from "../service/ctx.ts";
import { fakeRenderer } from "../service/render/fake-renderer.ts";
import { registry } from "../service/tools/index.ts";
import { PNG_1X1 } from "../test/png.ts";
import { fieldsOf } from "./args.ts";
import { run } from "./main.ts";

let ctx: Ctx;

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-cli-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  await mkdir(join(root, "presets", "animations"), { recursive: true });
  ctx = createCtx(root, fakeRenderer());

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (
    url: string | URL | Request,
    init?: RequestInit,
  ) => {
    if (String(url).includes("speech") || String(url).includes("audio")) {
      return new Response(new Uint8Array(100), {
        status: 200,
        headers: { "Content-Type": "audio/mpeg" },
      });
    }
    return originalFetch(url, init);
  }) as typeof fetch;
});

/** Runs a command line in-process and captures what it prints. */
const files: Record<string, string> = { "demo.json": '{"scene":"de-archivo"}' };

async function cli(argv: string[], stdin = "") {
  let stdout = "";
  let stderr = "";
  const code = await run(
    argv,
    {
      stdout: (t) => {
        stdout += t;
      },
      stderr: (t) => {
        stderr += t;
      },
      read: async (source) => {
        if (source === "-") return stdin;
        if (source in files) return files[source] as string;
        throw new Error("ENOENT");
      },
    },
    ctx,
  );
  return { code, stdout, stderr };
}

describe("lienzo CLI", () => {
  it("lists every registry tool in --help, and each tool's flags (R2)", async () => {
    const all = await cli(["--help"]);
    expect(all.code).toBe(0);
    for (const t of registry.tools) {
      expect(all.stdout).toContain(t.name);
      const one = await cli([t.name, "--help"]);
      expect(one.code).toBe(0);
      for (const f of fieldsOf(t)) expect(one.stdout).toContain(f.name);
    }
  });

  it("calls every registry tool, from flags or --json (R1)", async () => {
    const called = new Set<string>();
    const ok = async (argv: string[], stdin?: string) => {
      const r = await cli(argv, stdin);
      expect(r.stderr).toBe("");
      expect(r.code).toBe(0);
      called.add(argv[0] as string);
      return JSON.parse(r.stdout);
    };
    const recipe = (await ok([
      "preset_get",
      "--name",
      "01-tarjeta-neon",
    ])) as unknown;
    await ok(["component_list"]);
    await ok(["preset_list"]);
    await ok(["preset_validate", "--json", JSON.stringify({ recipe })]);
    await ok(["project_create", "--project", "p", "--name", "P"]);
    await ok(
      ["scene_create", "--project", "p", "--json", "-"],
      '{"scene":"demo"}',
    );
    await ok(["scene_create", "--project", "p", "--json", "@demo.json"]);
    await ok(["scene_list", "--project", "p"]);
    await ok(["scene_get", "--project", "p", "--scene", "demo"]);
    await ok(["scene_validate", "--project", "p", "--json", '{"data":{}}']);
    const { id } = await ok([
      "element_add",
      "--project",
      "p",
      "--scene",
      "demo",
      "--kind",
      "rect",
      "--json",
      '{"at":{"x":10,"y":20}}',
    ]);
    await ok([
      "element_update",
      "--project",
      "p",
      "--scene",
      "demo",
      "--id",
      id,
      "--json",
      '{"patch":{"x":5}}',
    ]);
    await ok([
      "element_add",
      "--project",
      "p",
      "--scene",
      "demo",
      "--kind",
      "ellipse",
    ]);
    await ok([
      "element_move",
      "--project",
      "p",
      "--scene",
      "demo",
      "--id",
      id,
      "--to",
      "1",
    ]);
    await ok([
      "element_move",
      "--project",
      "p",
      "--scene",
      "demo",
      "--id",
      id,
      "--to",
      "back",
    ]);
    await ok([
      "background_set",
      "--project",
      "p",
      "--json",
      '{"scene":"demo","patch":{}}',
    ]);
    await ok([
      "keyframe_set",
      "--project",
      "p",
      "--scene",
      "demo",
      "--id",
      id,
      "--path",
      "x",
      "--t",
      "0",
      "--value",
      "3",
    ]);
    await ok([
      "keyframe_remove",
      "--project",
      "p",
      "--scene",
      "demo",
      "--id",
      id,
      "--path",
      "x",
      "--t",
      "0",
    ]);
    await ok([
      "project_create",
      "--project",
      "test-proj",
      "--name",
      "Test Proj",
    ]);
    await ok(["project_list"]);
    await ok(["project_inspect", "--project", "test-proj"]);
    await ok(["project_delete", "--project", "test-proj"]);
    await ok([
      "scene_generate_speech",
      "--project",
      "p",
      "--scene",
      "demo",
      "--script",
      "Hola mundo",
      "--provider",
      "local",
    ]);
    await ok([
      "scene_preview",
      "--project",
      "p",
      "--scene",
      "demo",
      "--t",
      "1",
    ]);
    await ok(["scene_inspect_layout", "--project", "p", "--scene", "demo"]);
    await ok([
      "scene_build",
      "--project",
      "p",
      "--json",
      '{"compact":{"elements":[]}}',
    ]);
    await ok([
      "scene_export",
      "--project",
      "p",
      "--scene",
      "demo",
      "--format",
      "gif",
    ]);
    await ok([
      "element_remove",
      "--project",
      "p",
      "--scene",
      "demo",
      "--id",
      id,
    ]);
    // decoding the picture is the browser boundary (049/D1): a fake probe
    ctx.images = {
      opaqueBounds: async () => ({ x: 0.25, y: 0.25, w: 0.5, h: 0.5 }),
      dispose: async () => {},
    };
    const image = (await ok(
      ["element_add", "--project", "p", "--json", "-"],
      '{"scene":"demo","kind":"image","patch":{"src":"assets/logo.png"}}',
    )) as { id: string };
    await ok([
      "image_trim",
      "--project",
      "p",
      "--scene",
      "demo",
      "--id",
      image.id,
    ]);
    await ok([
      "shot_set",
      "--project",
      "p",
      "--scene",
      "demo",
      "--id",
      "intro",
      "--start",
      "0",
      "--end",
      "2",
    ]);
    await ok([
      "scene_update",
      "--project",
      "p",
      "--scene",
      "demo",
      "--json",
      '{"patch":{"duration":3}}',
    ]);
    const a = await ok([
      "element_add",
      "--project",
      "p",
      "--scene",
      "demo",
      "--kind",
      "rect",
    ]);
    const b = await ok([
      "element_add",
      "--project",
      "p",
      "--scene",
      "demo",
      "--kind",
      "rect",
    ]);
    const group = await ok([
      "element_group",
      "--project",
      "p",
      "--scene",
      "demo",
      "--json",
      JSON.stringify({ ids: [a.id, b.id] }),
    ]);
    await ok([
      "element_ungroup",
      "--project",
      "p",
      "--scene",
      "demo",
      "--id",
      group.id,
    ]);
    await ok([
      "scene_rename",
      "--project",
      "p",
      "--from",
      "demo",
      "--to",
      "demo2",
    ]);
    await ok(["scene_delete", "--project", "p", "--scene", "demo2"]);
    await ok([
      "preset_save",
      "--project",
      "p",
      "--json",
      JSON.stringify({
        recipe: {
          ...(recipe as { recipe: object }).recipe,
          name: "Tarjeta propia",
        },
      }),
    ]);
    await ok([
      "preset_rename",
      "--project",
      "p",
      "--from",
      "Tarjeta propia",
      "--to",
      "otro",
    ]);
    await ok(["preset_delete", "--project", "p", "--name", "otro"]);
    await ok([
      "animation_save",
      "--json",
      '{"recipe":{"name":"Salto","anim":{"in":{"kind":"fade"}}}}',
    ]);
    await ok(["animation_list"]);
    await ok(["animation_delete", "--name", "salto"]);
    await ok(["project_update", "--project", "p", "--name", "P2"]);
    const logo = join(tmpdir(), `lienzo-cli-logo-${process.pid}.png`);
    await writeFile(logo, PNG_1X1);
    const added = (await ok([
      "asset_add",
      "--project",
      "p",
      "--file",
      logo,
    ])) as {
      filename: string;
    };
    await ok([
      "asset_rename",
      "--project",
      "p",
      "--from",
      added.filename,
      "--to",
      "logo.png",
    ]);
    await ok(["asset_delete", "--project", "p", "--path", "logo.png"]);
    await ok(["font_list"]);
    // Google Fonts is the network boundary: a recorded css2 answer and fake files.
    const css = await readFile(
      "src/test/fixtures/google-css2-roboto-ttf.css",
      "utf8",
    );
    ctx.fetch = (async (url: string) =>
      new Response(
        url.startsWith("https://fonts.googleapis.com/") ? css : "ttf",
      )) as typeof fetch;
    await ok(["font_install", "--family", "Roboto"]);
    expect([...called].sort()).toEqual(
      registry.tools.map((t) => t.name).sort(),
    );
  });

  it("reports errors as JSON on stderr with exit code 1 (R3)", async () => {
    for (const argv of [
      ["no_such_tool"],
      ["scene_get", "--scene", "missing"],
      ["scene_get"],
      ["scene_get", "--bogus", "1"],
      ["scene_create", "--json", "{not json"],
      ["scene_create", "--json", "@missing.json"],
      ["scene_get", "stray"],
    ]) {
      const r = await cli(argv);
      expect(r.code).toBe(1);
      expect(r.stdout).toBe("");
      expect(JSON.parse(r.stderr)).toHaveProperty("code");
    }
  });

  it("loads in Node through tsx, outside Vite (A22)", async () => {
    const { stdout } = await promisify(execFile)(process.execPath, [
      "--import",
      "tsx",
      "src/cli/main.ts",
      "--help",
    ]);
    expect(stdout).toContain("scene_create");
  }, 30_000);
});
