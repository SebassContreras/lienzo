import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement, descriptorOf } from "../components/index.ts";
import { defaultScene, type GroupEl, type Scene } from "../model/model.ts";
import { loadSceneAssets } from "./assets.ts";

/** A promise and the function that resolves it, so a test decides when loading ends. */
function deferred() {
  let resolve = () => {};
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

/** Whether `promise` has settled once pending callbacks have run. */
async function settled(promise: Promise<unknown>): Promise<boolean> {
  let done = false;
  promise.then(() => {
    done = true;
  });
  await new Promise((r) => setTimeout(r, 0));
  return done;
}

/** A scene whose only element is a cube 3D element inside a group. */
function sceneWithGroupedCube(): Scene {
  const group = createElement("group") as GroupEl;
  group.children = [createElement("three")];
  return { ...defaultScene(), elements: [group] };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadSceneAssets", () => {
  it("waits for the code a kind loads lazily, even inside a group", async () => {
    const code = deferred();
    vi.spyOn(descriptorOf("three"), "load").mockReturnValue(code.promise);

    const loading = loadSceneAssets(sceneWithGroupedCube());

    expect(await settled(loading)).toBe(false);
    code.resolve();
    expect(await settled(loading)).toBe(true);
  });
});
