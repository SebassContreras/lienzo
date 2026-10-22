import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleProjectApi } from "./project-middleware.ts";
import { createProjectStore, type ProjectStore } from "./project-store.ts";

function createMockReq(options: {
  method?: string;
  url: string;
  body?: Buffer | string;
}): IncomingMessage {
  const buf = Buffer.isBuffer(options.body)
    ? options.body
    : Buffer.from(options.body ?? "");
  const readable = Readable.from(
    buf.length > 0 ? [buf] : [],
  ) as unknown as IncomingMessage;
  readable.method = options.method ?? "GET";
  readable.url = options.url;
  return readable;
}

function createMockRes(): {
  res: ServerResponse;
  getStatus: () => number;
  getBody: () => string;
  getBuffer: () => Buffer;
  getHeaders: () => Record<string, string>;
} {
  let statusCode = 200;
  const headers: Record<string, string> = {};
  const chunks: Buffer[] = [];

  const res = {
    statusCode: 200,
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
    },
    end(data?: unknown) {
      statusCode = (this as { statusCode?: number }).statusCode || 200;
      if (data) {
        chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(String(data)));
      }
    },
  } as unknown as ServerResponse;

  return {
    res,
    getStatus: () => statusCode,
    getBody: () => Buffer.concat(chunks).toString("utf8"),
    getBuffer: () => Buffer.concat(chunks),
    getHeaders: () => headers,
  };
}

describe("project-middleware asset endpoints", () => {
  let tempRoot: string;
  let store: ProjectStore;

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "lienzo-project-mw-test-"));
    store = createProjectStore(tempRoot);
    await store.create("acme", {
      name: "Acme Corp",
      palette: { primary: "#ff5500", custom: [] },
      fonts: [],
      canvas: { width: 1080, height: 1080, fps: 30, duration: 5 },
    });
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("uploads an asset to projects/:slug/assets and returns relative path", async () => {
    const pngData = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    const req = createMockReq({
      method: "POST",
      url: "/api/projects/acme/assets?ext=png",
      body: pngData,
    });
    const { res, getStatus, getBody } = createMockRes();

    await handleProjectApi(store, req, res);

    expect(getStatus()).toBe(201);
    const parsed = JSON.parse(getBody());
    expect(parsed.path).toMatch(/^\/projects\/acme\/assets\/[a-f0-9]+\.png$/);
    expect(parsed.filename).toMatch(/^[a-f0-9]+\.png$/);

    const onDisk = await readFile(
      join(store.resolvePath("acme", "assets"), parsed.filename),
    );
    expect(onDisk).toEqual(pngData);
  });

  it("serves an uploaded project asset via GET /api/projects/:slug/assets/:filename", async () => {
    const pngData = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    const uploadReq = createMockReq({
      method: "POST",
      url: "/api/projects/acme/assets?ext=png",
      body: pngData,
    });
    const { res: uploadRes, getBody } = createMockRes();
    await handleProjectApi(store, uploadReq, uploadRes);
    const { filename } = JSON.parse(getBody());

    const getReq = createMockReq({
      method: "GET",
      url: `/api/projects/acme/assets/${filename}`,
    });
    const { res: getRes, getStatus, getHeaders, getBuffer } = createMockRes();
    await handleProjectApi(store, getReq, getRes);

    expect(getStatus()).toBe(200);
    expect(getHeaders()["content-type"]).toBe("image/png");
    expect(getBuffer()).toEqual(pngData);
  });

  it("serves an asset stored in a subfolder of assets/", async () => {
    const jpg = Buffer.from("jpeg-bytes");
    await mkdir(join(store.resolvePath("acme", "assets"), "brand"), {
      recursive: true,
    });
    await writeFile(
      join(store.resolvePath("acme", "assets"), "brand", "profile.jpg"),
      jpg,
    );

    const { res, getStatus, getHeaders, getBuffer } = createMockRes();
    await handleProjectApi(
      store,
      createMockReq({ url: "/api/projects/acme/assets/brand/profile.jpg" }),
      res,
    );

    expect(getStatus()).toBe(200);
    expect(getHeaders()["content-type"]).toBe("image/jpeg");
    expect(getBuffer()).toEqual(jpg);
  });

  it("serves an asset whose folder and file names have spaces and punctuation", async () => {
    const png = Buffer.from("png-bytes");
    const folder = join(store.resolvePath("acme", "assets"), "CAPS move");
    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, "01 - Close-up (front) & side.png"), png);

    const { res, getStatus, getBuffer } = createMockRes();
    await handleProjectApi(
      store,
      createMockReq({
        url: "/api/projects/acme/assets/CAPS%20move/01%20-%20Close-up%20(front)%20%26%20side.png",
      }),
      res,
    );

    expect(getStatus()).toBe(200);
    expect(getBuffer()).toEqual(png);
  });

  it("refuses an asset path that climbs out of assets/", async () => {
    const { res, getStatus } = createMockRes();

    await handleProjectApi(
      store,
      createMockReq({ url: "/api/projects/acme/assets/..%2Fproject.json" }),
      res,
    );

    expect(getStatus()).toBe(404);
  });

  it("lists assets in subfolders by their path relative to assets/", async () => {
    const assets = store.resolvePath("acme", "assets");
    await mkdir(join(assets, "broll", "deep"), { recursive: true });
    await writeFile(join(assets, "logo.png"), "x");
    await writeFile(join(assets, "broll", "deep", "clip.jpg"), "x");

    const details = await store.get("acme");

    expect(details?.assets).toEqual(["broll/deep/clip.jpg", "logo.png"]);
  });

  it("handles project-scoped presets via /api/projects/:slug/presets", async () => {
    const presetPayload = JSON.stringify({
      name: "Mi Preset de Marca",
      kind: "rect",
      traits: ["palette-brand"],
    });

    // POST /api/projects/acme/presets?name=mi-preset
    const saveReq = createMockReq({
      method: "POST",
      url: "/api/projects/acme/presets?name=mi-preset",
      body: Buffer.from(presetPayload),
    });
    const { res: saveRes, getStatus: getSaveStatus } = createMockRes();
    await handleProjectApi(store, saveReq, saveRes);
    expect(getSaveStatus()).toBe(200);

    // GET /api/projects/acme/presets
    const listReq = createMockReq({
      method: "GET",
      url: "/api/projects/acme/presets",
    });
    const {
      res: listRes,
      getStatus: getListStatus,
      getBody: getListBody,
    } = createMockRes();
    await handleProjectApi(store, listReq, listRes);
    expect(getListStatus()).toBe(200);
    const presets = JSON.parse(getListBody());
    expect(presets).toHaveLength(1);
    expect(presets[0].name).toBe("mi-preset");
    expect(presets[0].data.name).toBe("Mi Preset de Marca");
  });

  it("rejects unsupported extensions", async () => {
    const req = createMockReq({
      method: "POST",
      url: "/api/projects/acme/assets?ext=exe",
      body: Buffer.from("bad"),
    });
    const { res, getStatus } = createMockRes();
    await handleProjectApi(store, req, res);
    expect(getStatus()).toBe(400);
  });
});
