import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { readJson } from "./json-fs.ts";

it("finds a file stored under the slug used before accents were folded", async () => {
  const dir = await mkdtemp(join(tmpdir(), "lienzo-slug-"));
  await writeFile(join(dir, "tarjeta-ne-n.json"), '{"name":"Tarjeta Neón"}');

  const data = await readJson(dir, "Tarjeta Neón");

  expect(data).toEqual({ name: "Tarjeta Neón" });
});
