import { expect, it } from "vitest";
import { toolSuite } from "../../contract/support.ts";

const suite = toolSuite();
const { call } = suite;

const storedAudio = async (scene: string) => {
  const got = (await call("scene_get", { scene, full: true })) as {
    value: { audioTracks?: { assetId: string }[] };
  };
  return got.value.audioTracks?.map((t) => t.assetId);
};

it("scene_generate_speech stores its audio ref with the project prefix", async () => {
  suite.ctx().tts = {
    synthesizeSpeech: async () => ({
      audioBuffer: new Uint8Array(32000),
      format: "opus",
      mimeType: "audio/ogg",
    }),
    listModels: async () => [],
  };

  await call("scene_generate_speech", {
    scene: "s",
    script: "Hola",
    provider: "local",
    asTrack: true,
  });

  expect(
    (await storedAudio("s"))?.every((id) =>
      id.startsWith("/projects/p/assets/"),
    ),
  ).toBe(true);
});

it("scene_generate_speech fails on a missing scene before it synthesizes", async () => {
  const r = await call("scene_generate_speech", {
    scene: "nada",
    script: "Hola",
    provider: "local",
    baseUrl: "http://127.0.0.1:9",
  });
  expect(r).toMatchObject({
    ok: false,
    error: { code: "not_found", path: "scene" },
  });
});

it("scene_generate_speech names baseUrl and how to start the service when the local one is down", async () => {
  const r = await call("scene_generate_speech", {
    scene: "s",
    script: "Hola",
    provider: "local",
    baseUrl: "http://127.0.0.1:9",
  });
  expect(r).toMatchObject({
    ok: false,
    error: {
      path: "baseUrl",
      message: expect.stringMatching(/127\.0\.0\.1:9.*Arranca el servicio/),
    },
  });
});
