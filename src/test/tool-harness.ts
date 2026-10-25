/** A fresh project in a temp folder and a typed way to call its tools, for tool tests. */
import { cp, mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Ctx, createCtx } from "../service/ctx.ts";
import { fakeRenderer } from "../service/fake-renderer.ts";
import { registry } from "../service/tools/index.ts";

/** Every call names the test project (046/R1); tools without `project` ignore it. */
export const PROJECT = "mi-proyecto";

export type ToolHarness = Awaited<ReturnType<typeof toolHarness>>;

export async function toolHarness() {
  const root = await mkdtemp(join(tmpdir(), "lienzo-tools-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  await mkdir(join(root, "presets", "animations"), { recursive: true });
  const harness = {
    /** Replaceable, e.g. by a context with another renderer, before the next call. */
    ctx: createCtx(root, fakeRenderer()) as Ctx,

    /** Calls tool `name` in the project and returns its result as is. */
    call(name: string, input: unknown) {
      const scoped =
        input && typeof input === "object"
          ? { project: PROJECT, ...input }
          : input;
      return registry.call(name, scoped, harness.ctx);
    },

    /** Calls tool `name` and returns its value; throws on a tool error. */
    async ok(name: string, input: unknown) {
      const r = await harness.call(name, input);
      if (!r.ok) throw new Error(`${name}: ${JSON.stringify(r.error)}`);
      return r.value as Record<string, unknown>;
    },
  };
  await registry.call(
    "project_create",
    { slug: PROJECT, name: "Mi proyecto" },
    harness.ctx,
  );
  return harness;
}
