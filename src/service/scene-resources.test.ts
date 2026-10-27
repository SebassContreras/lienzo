import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, expect, it } from "vitest";
import { type Ctx, createCtx } from "./ctx.ts";
import { fakeRenderer } from "./fake-renderer.ts";
import { registry } from "./tools/index.ts";

let ctx: Ctx;
const build = (compact: unknown, save?: string) =>
  registry.call("scene_build", { project: "p", compact, save }, ctx);

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-res-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  ctx = createCtx(root, fakeRenderer());
  await registry.call("project_create", { project: "p", name: "P" }, ctx);
});

it("notes a missing image (069/D8)", async () => {
  const r = await build({
    elements: [{ kind: "image", id: "img", src: "missing.png" }],
  });

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringContaining("«img»")] },
  });
});

it("rejects an unknown icon, suggesting the closest name (074/R1)", async () => {
  const r = await build({
    elements: [{ kind: "icon", id: "i", icon: "Wrenchh" }],
  });

  expect(r).toMatchObject({
    ok: false,
    error: {
      code: "unknown_icon",
      message: expect.stringContaining("«Wrench»"),
    },
  });
});

it("takes an icon name in any case or kebab-case (074/R1)", async () => {
  const r = await build(
    { elements: [{ kind: "icon", id: "i", icon: "arrow-right" }] },
    "s",
  );
  const scene = await registry.call(
    "scene_get",
    { project: "p", scene: "s", full: true },
    ctx,
  );

  expect(r).toMatchObject({ ok: true, value: { notices: [] } });
  expect(scene).toMatchObject({
    ok: true,
    value: { elements: [{ icon: "ArrowRight" }] },
  });
});

it("rejects a line attached to an id the scene lacks, listing the ids (074/R1)", async () => {
  const r = await build({
    elements: [
      { kind: "rect", id: "r" },
      { kind: "line", id: "l", to: "nope" },
    ],
  });

  expect(r).toMatchObject({
    ok: false,
    error: { code: "unknown_target", message: expect.stringContaining("«r»") },
  });
});

it("notes a missing resource once when the build is saved (070/D3)", async () => {
  const r = await build(
    { elements: [{ kind: "image", id: "img", src: "missing.png" }] },
    "s",
  );

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringContaining("«img»")] },
  });
});

const call = (name: string, input: Record<string, unknown>) =>
  registry.call(name, { project: "p", scene: "s", ...input }, ctx);
const savedWithMissingImage = () =>
  build(
    {
      elements: [
        { kind: "image", id: "img", src: "missing.png" },
        { kind: "rect", id: "r" },
        { kind: "line", id: "l", from: "r", to: "img" },
      ],
    },
    "s",
  );

it("leaves out notices about elements a write did not change (071/D3)", async () => {
  await savedWithMissingImage();

  const r = await call("element_update", { id: "r", patch: { w: 120 } });

  expect(r).toMatchObject({ ok: true, value: { notices: [] } });
});

it("notes a missing resource on the element a write changed (071/D3)", async () => {
  await savedWithMissingImage();

  const r = await call("element_update", { id: "img", patch: { w: 80 } });

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringContaining("«img»")] },
  });
});

it("notes a line end left loose by removing its element (071/D3)", async () => {
  await savedWithMissingImage();

  const r = await call("element_remove", { id: "r" });

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringContaining("«l»")] },
  });
});
