import type { IncomingMessage, ServerResponse } from "node:http";
import { createProjectStore, type ProjectStore } from "./project-store.ts";

export type ProjectApiReply = { status: number; body: unknown };

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

    jsonReply(404, { error: "Ruta no encontrada" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    jsonReply(400, { error: message });
  }
}
