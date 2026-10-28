import { cp, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { PNG_1X1 } from "../../test/png.ts";
import { createCtx } from "../ctx.ts";
import { fakeRenderer } from "../fake-renderer.ts";
import { registry } from "../tools/index.ts";

it("gives an image its picture's aspect unless the input sets one (069/D14)", async () => {
  const root = await mkdtemp(join(tmpdir(), "lienzo-aspect-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  const ctx = createCtx(root, fakeRenderer());
  const call = (name: string, input: Record<string, unknown>) =>
    registry.call(name, { project: "p", ...input }, ctx);
  await call("project_create", { name: "P" });
  const file = join(root, "square.png");
  await writeFile(file, PNG_1X1);
  const added = await call("asset_add", { file });
  const { src } = (added as { value: { src: string } }).value;

  const built = await call("scene_build", {
    compact: {
      elements: [
        { kind: "image", src, w: 300 },
        { kind: "image", src, aspect: 2 },
      ],
    },
  });

  expect(built).toMatchObject({
    ok: true,
    value: {
      scene: {
        elements: [{ aspect: 1, w: 300, h: 300 }, { aspect: 2 }],
      },
    },
  });
});
