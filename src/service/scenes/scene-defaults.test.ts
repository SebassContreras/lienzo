import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { type Ctx, createCtx } from "../ctx.ts";
import { fakeRenderer } from "../render/fake-renderer.ts";
import { registry } from "../tools/index.ts";

let ctx: Ctx;
const call = (name: string, input: Record<string, unknown>) =>
  registry.call(name, { project: "p", ...input }, ctx);

const backgroundOf = async (scene: string) => {
  const got = (await call("scene_get", { scene, full: true })) as {
    value: { background: Record<string, unknown> };
  };
  return got.value.background;
};

beforeEach(async () => {
  ctx = createCtx(
    await mkdtemp(join(tmpdir(), "lienzo-defaults-")),
    fakeRenderer(),
  );
  await call("project_create", {
    name: "P",
    palette: { primary: "#3b82f6", background: "#112233" },
  });
});

describe("scene_create backgrounds (065/R1, R2)", () => {
  it("starts from the palette background as a solid color", async () => {
    await call("scene_create", { scene: "s" });

    expect(await backgroundOf("s")).toMatchObject({
      color: "#112233",
      gradient: false,
      dots: false,
      spotlight: 0,
    });
  });

  it("takes a color string as a solid background", async () => {
    const created = await call("scene_create", {
      scene: "s",
      data: { background: "#abcdef" },
    });

    expect(created).toMatchObject({ ok: true });
    expect(await backgroundOf("s")).toMatchObject({
      color: "#abcdef",
      gradient: false,
      dots: false,
    });
  });

  it("merges a partial background onto the palette's solid one", async () => {
    await call("scene_create", {
      scene: "s",
      data: { background: { dots: true } },
    });

    expect(await backgroundOf("s")).toMatchObject({
      color: "#112233",
      gradient: false,
      dots: true,
    });
  });

  it("fails on a string that is neither a color nor a background preset", async () => {
    const created = await call("scene_create", {
      scene: "s",
      data: { background: "azulito" },
    });

    expect(created).toMatchObject({
      ok: false,
      error: { code: "invalid_input", path: "data.background" },
    });
  });
});
