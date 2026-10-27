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

it("notes unknown icons, missing images and loose line ends (069/D8)", async () => {
  const r = await build({
    elements: [
      { kind: "icon", id: "i", icon: "no-such-icon" },
      { kind: "image", id: "img", src: "missing.png" },
      { kind: "line", id: "l", to: "nope" },
      { kind: "icon", id: "ok", icon: "Wrench" },
    ],
  });

  expect(r).toMatchObject({
    ok: true,
    value: {
      notices: [
        expect.stringContaining("«i»"),
        expect.stringContaining("«img»"),
        expect.stringContaining("«l»"),
      ],
    },
  });
});

it("notes a missing resource once when the build is saved (070/D3)", async () => {
  const r = await build(
    { elements: [{ kind: "icon", id: "i", icon: "no-such-icon" }] },
    "s",
  );

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringContaining("«i»")] },
  });
});

const call = (name: string, input: Record<string, unknown>) =>
  registry.call(name, { project: "p", scene: "s", ...input }, ctx);
const savedWithMissingIcon = () =>
  build(
    {
      elements: [
        { kind: "icon", id: "i", icon: "no-such-icon" },
        { kind: "rect", id: "r" },
        { kind: "line", id: "l", from: "r", to: "i" },
      ],
    },
    "s",
  );

it("leaves out notices about elements a write did not change (071/D3)", async () => {
  await savedWithMissingIcon();

  const r = await call("element_update", { id: "r", patch: { w: 120 } });

  expect(r).toMatchObject({ ok: true, value: { notices: [] } });
});

it("notes a missing resource on the element a write changed (071/D3)", async () => {
  await savedWithMissingIcon();

  const r = await call("element_update", { id: "i", patch: { w: 80 } });

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringContaining("«i»")] },
  });
});

it("notes a line end left loose by removing its element (071/D3)", async () => {
  await savedWithMissingIcon();

  const r = await call("element_remove", { id: "r" });

  expect(r).toMatchObject({
    ok: true,
    value: { notices: [expect.stringContaining("«l»")] },
  });
});
