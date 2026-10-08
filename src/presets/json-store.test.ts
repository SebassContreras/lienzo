import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleStore } from "./json-store.ts";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "lienzo-store-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const call = (method: string, path: string, body?: unknown) =>
  handleStore(dir, method, new URL(path, "http://localhost"), async () =>
    JSON.stringify(body),
  );
const read = async (file: string) =>
  JSON.parse(await readFile(join(dir, file), "utf8"));

describe("json store", () => {
  it("writes under the slug and lists what it wrote", async () => {
    expect(
      await call("POST", "/api/presets?name=Mi Tarjeta", { a: 1 }),
    ).toEqual({ status: 200, body: { name: "mi-tarjeta" } });
    expect(await call("GET", "/api/presets")).toEqual({
      status: 200,
      body: [{ name: "mi-tarjeta", data: { a: 1 } }],
    });
  });

  it("deletes a file, and answers 404 for one that is not there", async () => {
    await call("POST", "/api/scenes?name=uno", {});
    expect((await call("DELETE", "/api/scenes?name=uno")).status).toBe(200);
    expect(await readdir(dir)).toEqual([]);
    expect((await call("DELETE", "/api/scenes?name=uno")).status).toBe(404);
  });

  it("renames a file and the name stored inside it", async () => {
    await call("POST", "/api/presets?name=viejo", {
      name: "Viejo",
      kind: "rect",
    });
    expect(
      await call("POST", "/api/presets/rename?from=viejo&to=Nuevo nombre"),
    ).toEqual({ status: 200, body: { name: "nuevo-nombre" } });
    expect(await readdir(dir)).toEqual(["nuevo-nombre.json"]);
    expect(await read("nuevo-nombre.json")).toEqual({
      name: "Nuevo nombre",
      kind: "rect",
    });
  });

  it("renames a scene without adding a name field", async () => {
    await call("POST", "/api/scenes?name=a", { width: 10 });
    await call("POST", "/api/scenes/rename?from=a&to=b");
    expect(await read("b.json")).toEqual({ width: 10 });
  });

  it("refuses to rename over another file, onto nothing, or from nothing", async () => {
    await call("POST", "/api/scenes?name=a", { v: "a" });
    await call("POST", "/api/scenes?name=b", { v: "b" });
    expect((await call("POST", "/api/scenes/rename?from=a&to=b")).status).toBe(
      409,
    );
    expect((await call("POST", "/api/scenes/rename?from=a&to=")).status).toBe(
      400,
    );
    expect((await call("POST", "/api/scenes/rename?from=zz&to=c")).status).toBe(
      404,
    );
    expect(await read("a.json")).toEqual({ v: "a" });
    expect(await read("b.json")).toEqual({ v: "b" });
  });

  it("renaming to a name with the same slug keeps the file", async () => {
    await writeFile(join(dir, "tarjeta.json"), '{"name":"tarjeta"}');
    await call("POST", "/api/presets/rename?from=tarjeta&to=Tarjeta");
    expect(await readdir(dir)).toEqual(["tarjeta.json"]);
    expect(await read("tarjeta.json")).toEqual({ name: "Tarjeta" });
  });

  it("ignores other files and answers 405 to unknown routes", async () => {
    await writeFile(join(dir, "notes.txt"), "x");
    expect(await call("GET", "/api/scenes")).toEqual({ status: 200, body: [] });
    expect((await call("PUT", "/api/scenes?name=a")).status).toBe(405);
  });
});
