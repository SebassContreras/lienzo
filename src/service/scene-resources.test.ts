import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createCtx } from "./ctx.ts";
import { fakeRenderer } from "./fake-renderer.ts";
import { registry } from "./tools/index.ts";

it("notes unknown icons, missing images and loose line ends (069/D8)", async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-res-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  const ctx = createCtx(root, fakeRenderer());
  await registry.call("project_create", { project: "p", name: "P" }, ctx);
  const r = await registry.call(
    "scene_build",
    {
      project: "p",
      compact: {
        elements: [
          { kind: "icon", id: "i", icon: "no-such-icon" },
          { kind: "image", id: "img", src: "missing.png" },
          { kind: "line", id: "l", to: "nope" },
          { kind: "icon", id: "ok", icon: "Wrench" },
        ],
      },
    },
    ctx,
  );
  const notices = r.ok ? (r.value as { notices: string[] }).notices : [];
  expect(notices.filter((n) => /«(i|img|l)»/.test(n))).toHaveLength(3);
  expect(notices.some((n) => n.includes("«ok»"))).toBe(false);
});
