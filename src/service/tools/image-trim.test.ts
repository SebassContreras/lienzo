import { cp, mkdir, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { Crop } from "../../components/image/descriptor.ts";
import type { ImageEl, Scene } from "../../model/model.ts";
import { type Ctx, createCtx } from "../ctx.ts";
import { fakeRenderer } from "../fake-renderer.ts";
import type { ImageProbe } from "../image-probe.ts";
import { registry } from "./index.ts";

const PROJECT = "mi-proyecto";
const SCENE = "post";

/** Bounds by asset URL: a rectangle, `undefined` for a transparent picture, missing = unreadable. */
function fakeProbe(bounds: Record<string, Crop | undefined>): ImageProbe {
  return {
    opaqueBounds: async (src) => {
      if (!(src in bounds)) throw new Error(`cannot decode ${src}`);
      return bounds[src];
    },
    dispose: async () => {},
  };
}

const url = (file: string) => `/api/projects/${PROJECT}/assets/${file}`;

let ctx: Ctx;

async function setup(probe: ImageProbe) {
  const root = await mkdtemp(join(tmpdir(), "lienzo-trim-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  await mkdir(join(root, "presets", "animations"), { recursive: true });
  ctx = createCtx(root, fakeRenderer(), undefined, probe);
  await call("project_create", { slug: PROJECT, name: "Mi proyecto" });
  await call("scene_create", { project: PROJECT, name: SCENE });
}

function call(name: string, input: Record<string, unknown>) {
  return registry.call(name, { project: PROJECT, ...input }, ctx);
}

/** Adds a 2:1 picture `src` shown in a 200×100 box at (100, 50); returns its id. */
async function addImage(src: string, kind = "image"): Promise<string> {
  const r = await call("element_add", {
    scene: SCENE,
    kind,
    set: { x: 100, y: 50, w: 200, h: 100, src, aspect: 2 },
  });
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return (r.value as { id: string }).id;
}

async function onDisk(): Promise<Scene> {
  const raw = await readFile(
    join(ctx.root, "projects", PROJECT, "scenes", `${SCENE}.json`),
    "utf8",
  );
  return JSON.parse(raw) as Scene;
}

const HALF = { x: 0.25, y: 0.5, w: 0.5, h: 0.5 };

describe("image_trim", () => {
  beforeEach(() =>
    setup(
      fakeProbe({ [url("logo.png")]: HALF, [url("empty.png")]: undefined }),
    ),
  );

  it("saves the crop of the visible pixels with the content kept in place", async () => {
    const id = await addImage("assets/logo.png");

    const r = await call("image_trim", { scene: SCENE, id });

    expect(r.ok).toBe(true);
    const el = (await onDisk()).elements[0] as ImageEl;
    expect(el.crop).toEqual(HALF);
    expect({ x: el.x, y: el.y, w: el.w, h: el.h }).toEqual({
      x: 150,
      y: 100,
      w: 100,
      h: 50,
    });
  });

  it("fails with image_unreadable on id and leaves the scene unchanged", async () => {
    const id = await addImage("assets/broken.png");
    const before = await onDisk();

    const r = await call("image_trim", { scene: SCENE, id });

    expect(r.ok ? undefined : r.error).toMatchObject({
      code: "image_unreadable",
      path: "id",
    });
    expect(await onDisk()).toEqual(before);
  });

  it("fails with image_empty on id for a fully transparent picture", async () => {
    const id = await addImage("assets/empty.png");

    const r = await call("image_trim", { scene: SCENE, id });

    expect(r.ok ? undefined : r.error).toMatchObject({
      code: "image_empty",
      path: "id",
    });
  });

  it("fails with invalid_input for an element that is not an image", async () => {
    const r0 = await call("element_add", { scene: SCENE, kind: "rect" });
    const id = r0.ok ? (r0.value as { id: string }).id : "";

    const r = await call("image_trim", { scene: SCENE, id });

    expect(r.ok ? undefined : r.error).toMatchObject({
      code: "invalid_input",
      path: "id",
    });
  });
});

describe("element_add with trim", () => {
  beforeEach(() => setup(fakeProbe({ [url("logo.png")]: HALF })));

  it("adds the image already trimmed", async () => {
    const r = await call("element_add", {
      scene: SCENE,
      kind: "image",
      set: { src: "assets/logo.png", aspect: 2 },
      trim: true,
    });

    expect(r.ok).toBe(true);
    expect(((await onDisk()).elements[0] as ImageEl).crop).toEqual(HALF);
  });

  it("adds nothing when the picture cannot be read", async () => {
    const r = await call("element_add", {
      scene: SCENE,
      kind: "image",
      set: { src: "assets/broken.png" },
      trim: true,
    });

    expect(r.ok ? undefined : r.error).toMatchObject({
      code: "image_unreadable",
      path: "trim",
    });
    expect((await onDisk()).elements).toEqual([]);
  });
});
