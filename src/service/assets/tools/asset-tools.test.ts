import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { toolSuite } from "../../contract/support.ts";

const suite = toolSuite();
const { call } = suite;

const audioFile = async (name: string) => {
  const dir = join(suite.ctx().root, "projects", "p", "assets");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), Buffer.from("ID3"));
};

it("asset_delete refuses an audio file a scene uses, given bare", async () => {
  await audioFile("voz.mp3");
  await call("scene_update", {
    scene: "s",
    patch: { audioTracks: [{ id: "t1", assetId: "voz.mp3" }] },
  });

  expect(await call("asset_delete", { path: "voz.mp3" })).toMatchObject({
    ok: false,
    error: { code: "in_use" },
  });
});

it("asset_add refuses an .mp3 that is not audio", async () => {
  const dir = await mkdtemp(join(tmpdir(), "lienzo-audio-"));
  const file = join(dir, "voz.mp3");
  await writeFile(file, "not audio at all");
  expect(await call("asset_add", { file })).toMatchObject({
    ok: false,
    error: { code: "invalid_audio", path: "file" },
  });
});

it("asset_rename refuses a new extension", async () => {
  const dir = await mkdtemp(join(tmpdir(), "lienzo-audio-"));
  const file = join(dir, "voz.mp3");
  await writeFile(file, "ID3\u0004audio");
  const added = await call("asset_add", { file });
  const from = (added as { value: { filename: string } }).value.filename;
  expect(await call("asset_rename", { from, to: "voz.wav" })).toMatchObject({
    ok: false,
    error: { code: "asset_type_changed", path: "to" },
  });
});
