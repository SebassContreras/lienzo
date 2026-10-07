import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { slugify } from "./src/presets/slug.ts";

/**
 * Stores presets and scenes as plain JSON files at the repo root:
 * GET  /api/<kind>          -> [{ name, data }]
 * POST /api/<kind>?name=x   -> writes <kind>/<slug>.json
 */
function jsonStore(): Plugin {
  const kinds = ["presets", "scenes"];

  async function handle(
    kind: string,
    req: IncomingMessage,
    res: ServerResponse,
  ) {
    const dir = join(import.meta.dirname, kind);
    await mkdir(dir, { recursive: true });
    const url = new URL(req.url ?? "", "http://localhost");
    res.setHeader("content-type", "application/json");
    if (req.method === "GET") {
      const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
      const items = await Promise.all(
        files.map(async (f) => ({
          name: f.replace(/\.json$/, ""),
          data: JSON.parse(await readFile(join(dir, f), "utf8")),
        })),
      );
      res.end(JSON.stringify(items));
      return;
    }
    if (req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const name = slugify(url.searchParams.get("name") ?? "untitled");
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      await writeFile(
        join(dir, `${name}.json`),
        `${JSON.stringify(body, null, 2)}\n`,
      );
      res.end(JSON.stringify({ name }));
      return;
    }
    res.statusCode = 405;
    res.end("{}");
  }

  return {
    name: "json-store",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const kind = req.url?.match(/^\/api\/(\w+)/)?.[1];
        if (!kind || !kinds.includes(kind)) return next();
        handle(kind, req, res).catch((error: unknown) => {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(error) }));
        });
      });
    },
  };
}

const ASSET_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  webp: "image/webp",
};
const MAX_ASSET_BYTES = 20 * 1024 * 1024;

/**
 * Stores images used by scenes in `assets/` at the repo root:
 * POST /api/assets?ext=png  -> writes assets/<content hash>.png, returns { path }
 * GET  /assets/<file>       -> the stored file
 */
function assetStore(): Plugin {
  const dir = join(import.meta.dirname, "assets");

  async function upload(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? "", "http://localhost");
    const ext = (url.searchParams.get("ext") ?? "").toLowerCase();
    res.setHeader("content-type", "application/json");
    if (req.method !== "POST" || !ASSET_TYPES[ext]) {
      res.statusCode = 400;
      res.end(
        JSON.stringify({ error: "expected POST with ext=png|jpg|svg|webp" }),
      );
      return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += (chunk as Buffer).length;
      if (size > MAX_ASSET_BYTES) {
        res.statusCode = 413;
        res.end(JSON.stringify({ error: "file too large" }));
        return;
      }
      chunks.push(chunk as Buffer);
    }
    const data = Buffer.concat(chunks);
    const hash = createHash("sha256").update(data).digest("hex").slice(0, 16);
    const file = `${hash}.${ext === "jpeg" ? "jpg" : ext}`;
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, file), data);
    res.end(JSON.stringify({ path: `/assets/${file}` }));
  }

  async function serve(req: IncomingMessage, res: ServerResponse) {
    const file = (req.url ?? "").split("?")[0]?.replace(/^\/assets\//, "");
    const ext = file?.split(".").pop()?.toLowerCase() ?? "";
    if (!file || !/^[\w-]+\.\w+$/.test(file) || !ASSET_TYPES[ext]) {
      res.statusCode = 404;
      res.end();
      return;
    }
    try {
      const data = await readFile(join(dir, file));
      res.setHeader("content-type", ASSET_TYPES[ext]);
      res.end(data);
    } catch {
      res.statusCode = 404;
      res.end();
    }
  }

  return {
    name: "asset-store",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const handler = req.url?.startsWith("/api/assets")
          ? upload
          : req.url?.startsWith("/assets/")
            ? serve
            : undefined;
        if (!handler) return next();
        handler(req, res).catch((error: unknown) => {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(error) }));
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), jsonStore(), assetStore()],
});
