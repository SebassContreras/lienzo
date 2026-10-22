import { describe, expect, it } from "vitest";
import { defaultScene } from "../../model/model.ts";
import { incomingScene } from "./incoming.ts";

describe("incomingScene", () => {
  it("recognises the scene the editor itself wrote, whatever its formatting", () => {
    const scene = defaultScene();
    const text = JSON.stringify(scene, null, 2);

    const incoming = incomingScene(text, JSON.stringify(scene));

    expect(incoming).toEqual({ kind: "own" });
  });

  it("returns another writer's scene to show", () => {
    const scene = { ...defaultScene(), duration: 7 };

    const incoming = incomingScene(JSON.stringify(scene), undefined);

    expect(incoming.kind === "scene" && incoming.scene.duration).toBe(7);
  });

  it("reports a file that is not JSON as invalid", () => {
    const incoming = incomingScene("{ half written", undefined);

    expect(incoming.kind).toBe("invalid");
  });

  it("reports JSON that is not a scene as invalid", () => {
    const incoming = incomingScene('{"elements": 3}', undefined);

    expect(incoming.kind).toBe("invalid");
  });
});
