import { describe, expect, it } from "vitest";
import { defaultScene } from "../model/model.ts";
import { copyName, toStoredScenes } from "./scene-list.ts";

describe("toStoredScenes", () => {
  it("keeps a stored scene that passes the schema", () => {
    const [stored] = toStoredScenes([{ name: "post", data: defaultScene() }]);

    expect(stored).toHaveProperty("scene");
  });

  it("reports why a broken file is not a scene", () => {
    const [stored] = toStoredScenes([{ name: "roto", data: { width: "x" } }]);

    expect(stored).toHaveProperty("error");
  });
});

describe("copyName", () => {
  it("adds -copia to the name", () => {
    expect(copyName("post", ["post"])).toBe("post-copia");
  });

  it("numbers the copy when -copia is taken", () => {
    expect(copyName("post", ["post", "post-copia"])).toBe("post-copia-2");
  });
});
