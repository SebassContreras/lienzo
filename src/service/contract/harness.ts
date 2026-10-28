/**
 * A project in a temp dir for the contract suite (082): a ctx with the fake renderer and a
 * network that answers 404, the project `p` and its scene `s`.
 */
import { createHash } from "node:crypto";
import { cp, mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { type Ctx, createCtx } from "../core/ctx.ts";
import { fakeRenderer } from "../render/fake-renderer.ts";
import { registry } from "../tools/index.ts";

export type Sandbox = { ctx: Ctx; root: string };

export async function sandbox(): Promise<Sandbox> {
  const root = await mkdtemp(join(tmpdir(), "lienzo-contract-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  const ctx = createCtx(root, fakeRenderer());
  ctx.fetch = async () => new Response("not found", { status: 404 });
  await registry.call("project_create", { name: "P" }, ctx);
  await registry.call("scene_create", { project: "p", scene: "s" }, ctx);
  return { ctx, root };
}

async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) =>
      e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
    ),
  );
  return nested.flat();
}

/** Every file under `root` with a hash of its content: two equal snapshots are the same tree. */
export async function snapshot(root: string): Promise<string> {
  const lines = await Promise.all(
    (await files(root)).sort().map(async (file) => {
      const hash = createHash("sha1")
        .update(await readFile(file))
        .digest("hex");
      return `${relative(root, file).replaceAll("\\", "/")} ${hash}`;
    }),
  );
  return lines.join("\n");
}

/** A call that must succeed: its value, or an error naming the tool and what it answered. */
export async function must(
  ctx: Ctx,
  tool: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const result = await registry.call(tool, { project: "p", ...input }, ctx);
  if (!result.ok) {
    throw new Error(`${tool} failed: ${JSON.stringify(result.error)}`);
  }
  return result.value as Record<string, unknown>;
}
