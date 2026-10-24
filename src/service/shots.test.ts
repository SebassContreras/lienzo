import { cp, mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  applyCameraTransform,
  isElementActiveInShot,
  resolveShotCamera,
} from "../engine/shots.ts";
import { defaultElement, type Scene, type Shot } from "../model/model.ts";
import { type Ctx, createCtx } from "./ctx.ts";
import { fakeRenderer } from "./fake-renderer.ts";
import { registry } from "./tools/index.ts";

describe("shots and camera engine & tool (055/R1, R2, R3, T009)", () => {
  const PROJECT = "test-project";
  let ctx: Ctx;

  beforeEach(async () => {
    const root = await mkdtemp(join(tmpdir(), "lienzo-shots-"));
    await cp("presets/built-in", join(root, "presets", "built-in"), {
      recursive: true,
    });
    await mkdir(join(root, "presets", "animations"), { recursive: true });
    ctx = createCtx(root, fakeRenderer());
    await registry.call(
      "project_create",
      { slug: PROJECT, name: "Test Project" },
      ctx,
    );
  });

  it("determines element activity within shot windows and transition overlaps", () => {
    const shots: Shot[] = [
      {
        id: "shot-1",
        name: "Intro",
        start: 0,
        end: 2,
        transition: { kind: "cut", duration: 0 },
      },
      {
        id: "shot-2",
        name: "Climax",
        start: 2,
        end: 5,
        transition: { kind: "fade", duration: 0.5 },
      },
    ];

    const globalEl = { ...defaultElement("rect"), id: "global" };
    const shot1El = { ...defaultElement("rect"), id: "s1", shot: "shot-1" };
    const shot2El = { ...defaultElement("rect"), id: "s2", shot: "shot-2" };

    // Global element is active anytime
    expect(isElementActiveInShot(globalEl, 1, shots)).toBe(true);
    expect(isElementActiveInShot(globalEl, 4, shots)).toBe(true);

    // Shot 1 element active [0, 2]
    expect(isElementActiveInShot(shot1El, 1, shots)).toBe(true);
    expect(isElementActiveInShot(shot1El, 2.5, shots)).toBe(false);

    // Shot 2 element active [2 - 0.5, 5 + 0.5] = [1.5, 5.5] due to fade duration 0.5s
    expect(isElementActiveInShot(shot2El, 1.0, shots)).toBe(false);
    expect(isElementActiveInShot(shot2El, 1.8, shots)).toBe(true);
    expect(isElementActiveInShot(shot2El, 5.2, shots)).toBe(true);
    expect(isElementActiveInShot(shot2El, 5.8, shots)).toBe(false);
  });

  it("resolves static and keyframe-tracked camera parameters", () => {
    const staticShot: Shot = {
      id: "sh1",
      name: "Static",
      start: 0,
      end: 2,
      camera: { x: 100, y: -50, zoom: 1.5 },
    };
    expect(resolveShotCamera(staticShot, 1)).toEqual({
      x: 100,
      y: -50,
      zoom: 1.5,
    });

    const trackedShot: Shot = {
      id: "sh2",
      name: "Tracked",
      start: 0,
      end: 4,
      camera: {
        x: 0,
        tracks: {
          x: [
            { t: 0, value: 0, easing: "auto" },
            { t: 2, value: 200, easing: "auto" },
          ],
          zoom: [
            { t: 0, value: 1, easing: "auto" },
            { t: 2, value: 2, easing: "auto" },
          ],
        },
      },
    };

    expect(resolveShotCamera(trackedShot, 0)).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(resolveShotCamera(trackedShot, 1).x).toBeCloseTo(100, 0);
    expect(resolveShotCamera(trackedShot, 1).zoom).toBeCloseTo(1.5, 1);
  });

  it("applies camera transform centered at stage coordinates", () => {
    const calls: string[] = [];
    const mockCtx = {
      save: () => calls.push("save"),
      translate: (x: number, y: number) => calls.push(`translate(${x},${y})`),
      scale: (x: number, y: number) => calls.push(`scale(${x},${y})`),
    };

    applyCameraTransform(mockCtx, { x: 50, y: 20, zoom: 1.5 }, 1080, 1080);
    // Stage center is (540, 540). Translation is (540 + 50, 540 + 20) = (590, 560), then scale(1.5), then translate(-540, -540)
    expect(calls).toEqual([
      "translate(590,560)",
      "scale(1.5,1.5)",
      "translate(-540,-540)",
    ]);
  });

  it("creates, updates, and deletes shots using shot_set tool", async () => {
    await registry.call(
      "scene_create",
      { project: PROJECT, name: "demo", duration: 10 },
      ctx,
    );

    // 1. Create a shot
    const r1 = await registry.call(
      "shot_set",
      {
        project: PROJECT,
        scene: "demo",
        id: "intro",
        name: "Introducción",
        start: 0,
        end: 3,
        transition: { kind: "fade", duration: 0.5 },
        camera: { x: 10, y: 20, zoom: 1.2 },
      },
      ctx,
    );
    expect(r1.ok).toBe(true);

    const s1 = await registry.call(
      "scene_get",
      { project: PROJECT, scene: "demo" },
      ctx,
    );
    expect(s1.ok).toBe(true);
    if (!s1.ok) return;
    expect((s1.value as Scene).shots?.length).toBe(1);
    expect((s1.value as Scene).shots?.[0]?.id).toBe("intro");
    expect((s1.value as Scene).shots?.[0]?.camera?.zoom).toBe(1.2);

    // 2. Update existing shot
    const r2 = await registry.call(
      "shot_set",
      {
        project: PROJECT,
        scene: "demo",
        id: "intro",
        camera: { zoom: 1.8 },
      },
      ctx,
    );
    expect(r2.ok).toBe(true);

    const s2 = await registry.call(
      "scene_get",
      { project: PROJECT, scene: "demo" },
      ctx,
    );
    expect(s2.ok).toBe(true);
    if (!s2.ok) return;
    expect((s2.value as Scene).shots?.[0]?.camera?.zoom).toBe(1.8);
    expect((s2.value as Scene).shots?.[0]?.camera?.x).toBe(10); // preserved deepMerge

    // 3. Remove shot
    const r3 = await registry.call(
      "shot_set",
      {
        project: PROJECT,
        scene: "demo",
        id: "intro",
        remove: true,
      },
      ctx,
    );
    expect(r3.ok).toBe(true);

    const s3 = await registry.call(
      "scene_get",
      { project: PROJECT, scene: "demo" },
      ctx,
    );
    expect(s3.ok).toBe(true);
    if (!s3.ok) return;
    expect((s3.value as Scene).shots).toBeUndefined();
  });
});
