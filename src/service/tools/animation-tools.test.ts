import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, it } from "vitest";
import { type Ctx, createCtx } from "../ctx.ts";
import { fakeRenderer } from "../fake-renderer.ts";
import { registry } from "./index.ts";

const PROJECT = "p";
let ctx: Ctx;
const call = (name: string, input: Record<string, unknown>) =>
  registry.call(name, input, ctx);

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-anim-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  ctx = createCtx(root, fakeRenderer());
  await call("project_create", { project: PROJECT, name: "P" });
});

it("saves, lists and deletes a project animation with partial slots (069/D6)", async () => {
  const saved = await call("animation_save", {
    project: PROJECT,
    recipe: { name: "Pulso", anim: { loop: { kind: "pulse" } } },
  });
  expect(saved.ok).toBe(true);
  const listed = await call("animation_list", { project: PROJECT });
  expect(listed.ok && listed.value).toMatchObject({
    animations: [{ file: "pulso", source: "project" }],
  });
  expect(
    (await call("animation_list", {})).ok && (await call("animation_list", {})),
  ).toMatchObject({
    value: { animations: [] },
  });
  expect(
    (await call("animation_delete", { project: PROJECT, name: "pulso" })).ok,
  ).toBe(true);
  expect(
    await call("animation_delete", { project: PROJECT, name: "pulso" }),
  ).toMatchObject({
    ok: false,
    error: { code: "not_found" },
  });
});

it("lists and gets a project preset saved without traits (069/D6)", async () => {
  const saved = await call("preset_save", {
    project: PROJECT,
    recipe: { name: "Caja", kind: "rect" },
  });
  expect(saved.ok).toBe(true);
  const listed = await call("preset_list", { project: PROJECT });
  expect(
    listed.ok &&
      (listed.value as { name: string }[]).some((p) => p.name === "Caja"),
  ).toBe(true);
  expect(
    (await call("preset_get", { project: PROJECT, name: "Caja" })).ok,
  ).toBe(true);
  const inspected = await call("project_inspect", { project: PROJECT });
  expect(inspected.ok && inspected.value).toMatchObject({
    presets: ["caja.json"],
  });
});
