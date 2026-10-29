import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { type Ctx, createCtx } from "../../core/ctx.ts";
import { fakeRenderer } from "../../render/fake-renderer.ts";
import { registry } from "../../tools/index.ts";

let ctx: Ctx;
const validate = (input: Record<string, unknown>) =>
  registry.call("scene_validate", { project: "p", ...input }, ctx);

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-validate-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  ctx = createCtx(root, fakeRenderer());
  await registry.call("project_create", { name: "P" }, ctx);
});

const text = (id: string, extra = {}) => ({
  kind: "text",
  id,
  text: "x",
  ...extra,
});

describe("scene_validate answers every problem of its input as a verdict", () => {
  it.each([
    ["data", { data: { elements: [text("a"), text("a", { opacity: 2 })] } }],
    [
      "compact",
      {
        compact: {
          elements: [text("a"), text("a"), { kind: "rect", at: "x" }],
        },
      },
    ],
  ])("with %s: two problems at once", async (_, input) => {
    const result = await validate(input);

    expect(result).toMatchObject({ ok: true, value: { valid: false } });
    const errors = result.ok && (result.value as { errors?: unknown[] }).errors;
    expect((errors || []).length).toBeGreaterThanOrEqual(2);
  });

  it.each([
    ["both data and compact", { data: {}, compact: { elements: [] } }],
    ["neither", {}],
  ])("%s is a verdict on `compact`", async (_, input) => {
    const result = await validate(input);

    expect(result).toMatchObject({
      ok: true,
      value: { valid: false, path: "compact" },
    });
  });

  it("an unknown project still fails the call", async () => {
    const result = await registry.call(
      "scene_validate",
      { project: "nope", data: {} },
      ctx,
    );

    expect(result.ok).toBe(false);
  });
});
