import { listJson, removeJson, renameJson, writeJson } from "./json-fs.ts";

export type StoreReply = { status: number; body: unknown };

const RENAME_STATUS = { "empty name": 400, "not found": 404, "name taken": 409 };

/**
 * The JSON store behind `/api/presets` and `/api/scenes`, one file per item in `dir`:
 * GET                     -> [{ name, data }]
 * POST   ?name=x          -> writes <slug>.json
 * DELETE ?name=x          -> removes <slug>.json
 * POST   /rename?from=x&to=y -> moves the file; a stored `name` field becomes `y`
 */
export async function handleStore(
  dir: string,
  method: string,
  url: URL,
  body: () => Promise<string>,
): Promise<StoreReply> {
  const rest = url.pathname.replace(/^\/api\/\w+/, "");
  const q = url.searchParams;
  if (method === "GET" && rest === "") {
    return { status: 200, body: await listJson(dir) };
  }
  if (method === "POST" && rest === "") {
    const data = JSON.parse(await body());
    const name = await writeJson(dir, q.get("name") ?? "untitled", data);
    return { status: 200, body: { name } };
  }
  if (method === "DELETE" && rest === "") {
    if (!(await removeJson(dir, q.get("name") ?? "")))
      return { status: 404, body: { error: "not found" } };
    return { status: 200, body: {} };
  }
  if (method === "POST" && rest === "/rename") {
    const r = await renameJson(dir, q.get("from") ?? "", q.get("to") ?? "");
    if ("error" in r)
      return { status: RENAME_STATUS[r.error], body: { error: r.error } };
    return { status: 200, body: r };
  }
  return { status: 405, body: {} };
}
