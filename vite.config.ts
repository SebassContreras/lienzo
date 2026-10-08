import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { handleStore } from "./src/presets/json-store.ts";

/** Serves `presets/` and `scenes/` at the repo root through `handleStore`. */
function jsonStore(): Plugin {
  const kinds = ["presets", "scenes"];

  async function handle(
    kind: string,
    req: IncomingMessage,
    res: ServerResponse,
  ) {
    const url = new URL(req.url ?? "", "http://localhost");
    const body = async () => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      return Buffer.concat(chunks).toString("utf8");
    };
    const reply = await handleStore(
      join(import.meta.dirname, kind),
      req.method ?? "GET",
      url,
      body,
    );
    res.setHeader("content-type", "application/json");
    res.statusCode = reply.status;
    res.end(JSON.stringify(reply.body));
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
