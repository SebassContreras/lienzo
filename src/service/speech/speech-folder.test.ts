import { cp, mkdir, mkdtemp, readdir, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { getSceneAudioTracks } from "../../engine/audio/audio-tracks.ts";
import { type Ctx, createCtx } from "../core/ctx.ts";
import { fakeRenderer } from "../render/fake-renderer.ts";
import { registry } from "../tools/index.ts";
import type { TtsService } from "./types.ts";

const project = "voz";
let root: string;
let ctx: Ctx;

/** The only boundary stubbed: the speech provider returns fixed bytes per script. */
const tts: TtsService = {
  async synthesizeSpeech({ text }) {
    return {
      audioBuffer: new TextEncoder().encode(`ID3 ${text}`.padEnd(16000, ".")),
      mimeType: "audio/mpeg",
      format: "mp3",
      durationSeconds: 1,
    };
  },
  async listModels() {
    return [];
  },
};

const value = async (tool: string, input: Record<string, unknown>) => {
  const result = await registry.call(tool, input, ctx);
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value as Record<string, unknown>;
};

const speak = (scene: string, extra: Record<string, unknown> = {}) =>
  value("scene_generate_speech", {
    project,
    scene,
    script: "Hola",
    provider: "local",
    ...extra,
  });

const assetsDir = () => join(root, "projects", project, "assets");

const sceneAssetIds = async (stored: string) =>
  getSceneAudioTracks(
    JSON.parse(
      await readFile(
        join(root, "projects", project, "scenes", `${stored}.json`),
        "utf8",
      ),
    ),
  ).map((t) => t.assetId);

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "lienzo-voice-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  await mkdir(join(root, "presets", "animations"), { recursive: true });
  ctx = createCtx(root, fakeRenderer(), tts);
  await value("project_create", { project, name: "Voz" });
  await value("scene_create", { project, scene: "Caja Ámbar" });
});

describe("scene_generate_speech saves into voice/<scene>/", () => {
  it.each([
    {
      label: "stored name, scene.audio",
      scene: "caja-ambar",
      asTrack: undefined,
    },
    { label: "stored name, new track", scene: "caja-ambar", asTrack: true },
    {
      label: "folded name, scene.audio",
      scene: "Caja Ámbar",
      asTrack: undefined,
    },
    { label: "folded name, new track", scene: "Caja Ámbar", asTrack: true },
  ])("$label", async ({ scene, asTrack }) => {
    const { assetId } = await speak(scene, { asTrack });
    const path = String(assetId).replace(`/projects/${project}/assets/`, "");

    expect([
      path.startsWith("voice/caja-ambar/"),
      (await stat(join(assetsDir(), path))).isFile(),
      await sceneAssetIds("caja-ambar"),
    ]).toEqual([true, true, expect.arrayContaining([assetId])]);
  });

  it("gives the same script one path and one file", async () => {
    const first = await speak("caja-ambar");
    const second = await speak("caja-ambar", { asTrack: true });

    expect([
      second.assetId,
      await readdir(join(assetsDir(), "voice", "caja-ambar")),
    ]).toEqual([first.assetId, [expect.stringMatching(/\.mp3$/)]]);
  });
});
