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
const savePulse = () =>
  call("animation_save", {
    project: PROJECT,
    recipe: { name: "Pulso", anim: { loop: { kind: "pulse" } } },
  });

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-anim-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  ctx = createCtx(root, fakeRenderer());
  await call("project_create", { project: PROJECT, name: "P" });
});

it("saves a project animation with a partial slot (069/D6)", async () => {
  const saved = await savePulse();

  expect(saved).toMatchObject({ ok: true, value: { animation: "pulso" } });
});

it("lists a project animation only with its project (069/D6)", async () => {
  await savePulse();

  const scoped = await call("animation_list", { project: PROJECT });
  const global = await call("animation_list", {});

  expect(scoped).toMatchObject({
    ok: true,
    value: { animations: [{ file: "pulso", source: "project" }] },
  });
  expect(global).toMatchObject({ ok: true, value: { animations: [] } });
});

it("deletes a project animation, then fails on the gone name (069/D6)", async () => {
  await savePulse();

  const first = await call("animation_delete", {
    project: PROJECT,
    name: "pulso",
  });
  const again = await call("animation_delete", {
    project: PROJECT,
    name: "pulso",
  });

  expect(first).toMatchObject({ ok: true });
  expect(again).toMatchObject({ ok: false, error: { code: "not_found" } });
});

it("lists, gets and inspects a project preset saved without traits (069/D6)", async () => {
  await call("preset_save", {
    project: PROJECT,
    recipe: { name: "Caja", kind: "rect" },
  });

  const listed = await call("preset_list", { project: PROJECT });
  const got = await call("preset_get", { project: PROJECT, name: "Caja" });
  const inspected = await call("project_inspect", { project: PROJECT });

  expect(listed).toMatchObject({
    ok: true,
    value: expect.arrayContaining([expect.objectContaining({ name: "Caja" })]),
  });
  expect(got).toMatchObject({ ok: true, value: { file: "caja" } });
  expect(inspected).toMatchObject({
    ok: true,
    value: { presets: ["caja"] },
  });
});
