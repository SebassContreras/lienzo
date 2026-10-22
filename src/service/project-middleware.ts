import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import {
  ASSET_TYPES,
  hashBuffer,
  MAX_ASSET_BYTES,
  normalizeExtension,
} from "./asset-helpers.ts";
import { safeAssetPath } from "./asset-path.ts";
import type { ProjectStore } from "./project-store.ts";

export async function handleProjectApi(
  store: ProjectStore,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "", "http://localhost");
  const path = url.pathname.replace(/^\/api\/projects\/?/, "");
  const segments = path.split("/").filter(Boolean);

  const readBody = async (): Promise<string> => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks).toString("utf8");
  };

  const jsonReply = (status: number, body: unknown) => {
    res.setHeader("content-type", "application/json");
    res.statusCode = status;
    res.end(JSON.stringify(body));
  };

  try {
    // GET /api/projects -> list summaries
    if (segments.length === 0) {
      if (method === "GET") {
        const list = await store.list();
        jsonReply(200, list);
        return;
      }
      // POST /api/projects?slug=x -> create project
      if (method === "POST") {
        const slug = url.searchParams.get("slug") ?? "";
        const raw = JSON.parse(await readBody());
        const created = await store.create(slug, raw);
        jsonReply(201, created);
        return;
      }
    }

    // Single project operations: /api/projects/<slug>
    if (segments.length === 1) {
      const slug = segments[0];

      // GET /api/projects/<slug> -> get details
      if (method === "GET") {
        const details = await store.get(slug);
        if (!details) {
          jsonReply(404, { error: `No existe el proyecto «${slug}»` });
          return;
        }
        jsonReply(200, details);
        return;
      }

      // PATCH /api/projects/<slug> -> update config
      if (method === "PATCH" || method === "POST") {
        const raw = JSON.parse(await readBody());
        const updated = await store.update(slug, raw);
        jsonReply(200, updated);
        return;
      }

      // DELETE /api/projects/<slug> -> delete project
      if (method === "DELETE") {
        const deleted = await store.delete(slug);
        if (!deleted) {
          jsonReply(404, { error: `No existe el proyecto «${slug}»` });
          return;
        }
        jsonReply(200, { ok: true, slug });
        return;
      }
    }

    // Project scenes: /api/projects/<slug>/scenes
    if (segments.length >= 2 && segments[1] === "scenes") {
      const slug = segments[0];
      const projectScenesDir = store.resolvePath(slug, "scenes");
      const { handleStore } = await import("../presets/json-store.ts");

      // Adapt URL pathname so handleStore parses action/name params naturally
      const subUrl = new URL(url.toString());
      subUrl.pathname = subUrl.pathname.replace(
        /^\/api\/projects\/[^/]+\/scenes/,
        "/api/scenes",
      );

      const reply = await handleStore(
        projectScenesDir,
        method,
        subUrl,
        readBody,
      );
      jsonReply(reply.status, reply.body);
      return;
    }

    // Project presets: /api/projects/<slug>/presets
    if (segments.length >= 2 && segments[1] === "presets") {
      const slug = segments[0];
      const projectPresetsDir = store.resolvePath(slug, "presets");
      const { handleStore } = await import("../presets/json-store.ts");

      // Adapt URL pathname so handleStore parses action/name params naturally
      const subUrl = new URL(url.toString());
      subUrl.pathname = subUrl.pathname.replace(
        /^\/api\/projects\/[^/]+\/presets/,
        "/api/presets",
      );

      const reply = await handleStore(
        projectPresetsDir,
        method,
        subUrl,
        readBody,
      );
      jsonReply(reply.status, reply.body);
      return;
    }

    // Project assets: /api/projects/<slug>/assets
    if (segments.length >= 2 && segments[1] === "assets") {
      const slug = segments[0];

      // POST /api/projects/<slug>/assets?ext=png -> upload asset into projects/<slug>/assets/
      if (segments.length === 2 && method === "POST") {
        const extParam = (url.searchParams.get("ext") ?? "").toLowerCase();
        const ext = normalizeExtension(extParam);
        if (!ASSET_TYPES[ext]) {
          jsonReply(400, {
            error:
              "Formato no soportado. Se esperaba: png, jpg, svg, webp, glb, mp3, wav, aac, ogg, ttf, otf, woff, woff2",
          });
          return;
        }

        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of req) {
          size += (chunk as Buffer).length;
          if (size > MAX_ASSET_BYTES) {
            jsonReply(413, { error: "Archivo demasiado grande (máx 20MB)" });
            return;
          }
          chunks.push(chunk as Buffer);
        }

        const data = Buffer.concat(chunks);
        const hash = hashBuffer(data);
        const filename = `${hash}.${ext}`;
        const assetsDir = store.resolvePath(slug, "assets");

        await mkdir(assetsDir, { recursive: true });
        await writeFile(join(assetsDir, filename), data);

        const relativePath = `/projects/${slug}/assets/${filename}`;
        jsonReply(201, { path: relativePath, filename });
        return;
      }

      // GET /api/projects/<slug>/assets/<path...> -> serve project asset, subfolders too (044/D2)
      if (segments.length >= 3 && method === "GET") {
        const assetPath = safeAssetPath(segments.slice(2));
        const ext = normalizeExtension(assetPath?.split(".").pop() ?? "");
        if (!assetPath || !ASSET_TYPES[ext]) {
          res.statusCode = 404;
          res.end("Not Found");
          return;
        }

        const filePath = join(store.resolvePath(slug, "assets"), assetPath);
        try {
          const data = await readFile(filePath);
          res.setHeader("content-type", ASSET_TYPES[ext]);
          res.statusCode = 200;
          res.end(data);
          return;
        } catch {
          res.statusCode = 404;
          res.end("Not Found");
          return;
        }
      }
    }

    jsonReply(404, { error: "Ruta no encontrada" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    jsonReply(400, { error: message });
  }
}
