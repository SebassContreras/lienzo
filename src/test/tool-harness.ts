/** A fresh project in a temp folder and a typed way to call its tools, for tool tests. */
import { cp, mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Ctx, createCtx } from "../service/ctx.ts";
import { fakeRenderer } from "../service/fake-renderer.ts";
import { registry } from "../service/tools/index.ts";

export const PROJECT = "mi-proyecto";

export async function toolHarness() {
  const root = await mkdtemp(join(tmpdir(), "lienzo-tools-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  await mkdir(join(root, "presets", "animations"), { recursive: true });
  const ctx: Ctx = createCtx(root, fakeRenderer());
  await registry.call("project_create", { slug: PROJECT, name: "P" }, ctx);

  /** Calls tool `name` in the project and returns its value; throws on a tool error. */
  async function ok(name: string, input: object) {
    const r = await registry.call(name, { project: PROJECT, ...input }, ctx);
    if (!r.ok) throw new Error(`${name}: ${JSON.stringify(r.error)}`);
    return r.value as Record<string, unknown>;
  }

  return { ctx, ok };
}
