import { describe, expect, it } from "vitest";
import { assetFileName, assetFolderView } from "./asset-folders.ts";

const paths = [
  "brand/profile.jpg",
  "logo.png",
  "products/CAPS move/01 - tin.png",
  "products/CAPS move/02 - capsule.png",
  "products/FRESH cleanser/01 - bottle.png",
];

describe("assetFolderView", () => {
  it("shows the top-level folders with their file counts and the root files", () => {
    expect(assetFolderView(paths, "")).toEqual({
      folders: [
        { name: "brand", path: "brand", count: 1 },
        { name: "products", path: "products", count: 3 },
      ],
      files: ["logo.png"],
    });
  });

  it("shows the subfolders of a nested folder by their full path", () => {
    expect(assetFolderView(paths, "products").folders).toEqual([
      { name: "CAPS move", path: "products/CAPS move", count: 2 },
      { name: "FRESH cleanser", path: "products/FRESH cleanser", count: 1 },
    ]);
  });

  it("shows only the files directly inside the open folder", () => {
    expect(assetFolderView(paths, "products/CAPS move")).toEqual({
      folders: [],
      files: [
        "products/CAPS move/01 - tin.png",
        "products/CAPS move/02 - capsule.png",
      ],
    });
  });

  it("does not match a sibling folder that shares a name prefix", () => {
    expect(assetFolderView(["brand-old/a.png"], "brand")).toEqual({
      folders: [],
      files: [],
    });
  });
});

describe("assetFileName", () => {
  it("keeps only the last segment of a relative path", () => {
    expect(assetFileName("products/CAPS move/01 - tin.png")).toBe(
      "01 - tin.png",
    );
  });
});
