import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultScene, type Scene } from "../model/model.ts";
import { attachSpeechToScene } from "../service/tts/scene-audio.ts";

describe("Topbar AI Voice Integration (037/T009 - D6@1, R2@2, R3@1)", () => {
  it("verifies scene audio attaches unversioned asset hash path, never binary bytes", () => {
    // Scene audio attaches unversioned asset hash path, never binary bytes
    const baseScene: Scene = defaultScene();
    const updated = attachSpeechToScene(baseScene, {
      assetId: "/assets/abc123hash.mp3",
      audioDuration: 3.5,
      adjustSceneDuration: true,
    });

    expect(updated.audio?.assetId).toBe("/assets/abc123hash.mp3");
    // Ensure scene JSON is clean of raw buffers
    const sceneJson = JSON.stringify(updated);
    expect(sceneJson).not.toContain("Uint8Array");
    expect(sceneJson).toContain("/assets/abc123hash.mp3");
  });

  it("confirms .gitignore excludes generated audio assets from git tracking (R3@1)", () => {
    const gitignorePath = join(process.cwd(), ".gitignore");
    const gitignore = readFileSync(gitignorePath, "utf-8");

    // Must exclude assets/* while preserving .gitkeep
    expect(gitignore).toMatch(/assets\/\*/);
    expect(gitignore).toMatch(/!assets\/\.gitkeep/);
  });
});
