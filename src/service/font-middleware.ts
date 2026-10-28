/**
 * The font API for the editor and the render page (045/D2): routes only, the work is in
 * the font store and the font tools.
 * GET /api/fonts?project=<slug>              -> every usable font (resolveFonts)
 * GET /api/fonts/global/<file>               -> a global font file
 * GET /api/fonts/project/<slug>/<file>       -> a project font file
 * POST /api/fonts/upload?family=&weight=&ext=[&project=]  body: the file -> saveFont
 * POST /api/fonts/google { family, weights, project? }    -> installGoogleFont
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { ASSET_TYPES } from "./assets/asset-helpers.ts";
import {
  availableFonts,
  installGoogleFont,
  MAX_FONT_BYTES,
  saveFont,
} from "./font-install.ts";
import type { FontStore } from "./font-store.ts";

export async function handleFontApi(
  store: FontStore,
  req: IncomingMessage,
  res: ServerResponse,
  get: typeof fetch = fetch,
): Promise<void> {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "", "http://localhost");
  const segments = url.pathname
    .replace(/^\/api\/fonts\/?/, "")
    .split("/")
    .filter(Boolean)
    .map((s) => decodeURIComponent(s));

  const json = (status: number, body: unknown) => {
    res.setHeader("content-type", "application/json");
    res.statusCode = status;
    res.end(JSON.stringify(body));
  };

  try {
    if (method === "GET" && segments.length === 0) {
      const project = url.searchParams.get("project") || undefined;
      json(200, await availableFonts(store, project));
      return;
    }

    const file =
      segments[0] === "global" && segments.length === 2
        ? { name: segments[1], project: undefined }
        : segments[0] === "project" && segments.length === 3
          ? { name: segments[2], project: segments[1] }
          : undefined;
    if (method === "GET" && file) {
      const data = await store.read(file.name, file.project);
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!data || !ASSET_TYPES[ext]) {
        json(404, { error: "Fuente no encontrada" });
        return;
      }
      res.setHeader("content-type", ASSET_TYPES[ext]);
      res.statusCode = 200;
      res.end(data);
      return;
    }

    if (method === "POST" && segments[0] === "upload") {
      const q = url.searchParams;
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of req) {
        size += (chunk as Buffer).length;
        if (size > MAX_FONT_BYTES) {
          json(413, { error: "Archivo demasiado grande (máx 20MB)" });
          return;
        }
        chunks.push(chunk as Buffer);
      }
      const saved = await saveFont(
        store,
        {
          family: q.get("family") ?? "",
          weight: Number(q.get("weight") ?? 400),
          ext: q.get("ext") ?? "",
          project: q.get("project") || undefined,
        },
        Buffer.concat(chunks),
      );
      json(201, saved);
      return;
    }

    if (method === "POST" && segments[0] === "google") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      const saved = await installGoogleFont(
        store,
        {
          family: String(body.family ?? ""),
          weights: Array.isArray(body.weights)
            ? body.weights.map(Number)
            : [400],
          project: body.project || undefined,
        },
        get,
      );
      json(201, saved);
      return;
    }

    json(404, { error: "Ruta no encontrada" });
  } catch (error) {
    json(400, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
