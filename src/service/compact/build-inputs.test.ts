import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, it } from "vitest";
import { type Ctx, createCtx } from "../core/ctx.ts";
import { fakeRenderer } from "../render/fake-renderer.ts";
import { registry } from "../tools/index.ts";

let ctx: Ctx;
type Result =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: { code: string; message: string; path: string } };

const call = (name: string, input: Record<string, unknown>) =>
  registry.call(name, { project: "p", ...input }, ctx) as Promise<Result>;

const value = async (name: string, input: Record<string, unknown>) => {
  const r = await call(name, input);
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
};

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-qa6-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  ctx = createCtx(root, fakeRenderer());
  await call("project_create", {
    name: "P",
    canvas: { width: 1080, height: 1920, fps: 30, duration: 6 },
  });
});

it("builds an unsaved compact scene on the project's canvas", async () => {
  const out = await value("scene_build", { compact: { elements: [] } });

  expect(out.scene).toMatchObject({ width: 1080, height: 1920, duration: 6 });
});

it("sets a counter preset's final value with `to` in compact", async () => {
  const out = await value("scene_build", {
    compact: {
      elements: [{ preset: "Contador animado", from: 0, to: 1500 }],
    },
  });

  expect(out.scene).toMatchObject({ elements: [{ from: 0, to: 1500 }] });
});

it("points effects.glow at the element's own glow field", async () => {
  const out = await value("scene_build", {
    compact: { elements: [{ kind: "rect", effects: { glow: true } }] },
  });

  expect(out.notices).toEqual([
    expect.stringContaining("Glow: { enabled: true }"),
  ]);
});

it("wraps a long centred text with no w inside the canvas margins", async () => {
  const out = await value("scene_build", {
    compact: {
      size: "1080x1080",
      elements: [{ kind: "text", at: "center", text: "palabra ".repeat(80) }],
    },
  });

  expect(out.scene).toMatchObject({ elements: [{ w: 1080 - 2 * 54 }] });
});
