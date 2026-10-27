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
