import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { beforeEach, describe, expect, it } from "vitest";
import { type Ctx, createCtx } from "../service/ctx.ts";
import { fakeRenderer } from "../service/fake-renderer.ts";
import { registry } from "../service/tools/index.ts";
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
});

/** Runs a command line in-process and captures what it prints. */
const files: Record<string, string> = { "demo.json": '{"name":"de-archivo"}' };

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
    await ok(["scene_create", "--json", "-"], '{"name":"demo"}');
    await ok(["scene_create", "--json", "@demo.json"]);
    await ok(["scene_list"]);
    await ok(["scene_get", "--scene", "demo"]);
    await ok(["scene_validate", "--json", '{"scene":{}}']);
    const { id } = await ok([
      "element_add",
      "--scene",
      "demo",
      "--kind",
      "rect",
      "--json",
      '{"at":{"x":10,"y":20}}',
    ]);
    await ok([
      "element_update",
      "--scene",
      "demo",
      "--id",
      id,
      "--json",
      '{"patch":{"x":5}}',
    ]);
    await ok(["element_add", "--scene", "demo", "--kind", "ellipse"]);
    await ok(["element_move", "--scene", "demo", "--id", id, "--to", "1"]);
    await ok(["element_move", "--scene", "demo", "--id", id, "--to", "back"]);
    await ok(["background_set", "--json", '{"scene":"demo","values":{}}']);
    await ok([
      "keyframe_set",
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
      "--scene",
      "demo",
      "--id",
      id,
      "--path",
      "x",
      "--t",
      "0",
    ]);
    await ok(["scene_preview", "--scene", "demo", "--t", "1"]);
    await ok(["scene_export", "--scene", "demo", "--format", "gif"]);
    await ok(["element_remove", "--scene", "demo", "--id", id]);
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
