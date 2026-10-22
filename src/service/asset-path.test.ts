import { describe, expect, it } from "vitest";
import { assetSegments, projectAssetUrl, safeAssetPath } from "./asset-path.ts";

describe("safeAssetPath", () => {
  it("joins plain segments into a relative path", () => {
    expect(safeAssetPath(["brand", "profile.jpg"])).toBe("brand/profile.jpg");
  });

  it("rejects a parent-directory segment", () => {
    expect(safeAssetPath(["..", "project.json"])).toBeUndefined();
  });

  it("rejects an encoded slash that hides a parent directory", () => {
    expect(safeAssetPath(["..%2Fproject.json"])).toBeUndefined();
  });

  it("rejects an empty segment from an absolute path", () => {
    expect(safeAssetPath(["", "etc", "passwd"])).toBeUndefined();
  });
});

describe("assetSegments", () => {
  it("takes the path after /assets/ of a project URL", () => {
    expect(assetSegments("/api/projects/acme/assets/brand/a.png")).toEqual([
      "brand",
      "a.png",
    ]);
  });
});

describe("projectAssetUrl", () => {
  it("encodes each segment but keeps the subfolder slashes", () => {
    expect(projectAssetUrl("acme", "brand/mi logo.png")).toBe(
      "/api/projects/acme/assets/brand/mi%20logo.png",
    );
  });
});
