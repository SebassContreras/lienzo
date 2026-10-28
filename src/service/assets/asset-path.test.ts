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

describe("safeAssetPath with real-world names", () => {
  it("accepts spaces, accents, parentheses and an ampersand", () => {
    expect(
      safeAssetPath(["Diseño gráfico", "01 - after sun & tan (2).png"]),
    ).toBe("Diseño gráfico/01 - after sun & tan (2).png");
  });

  it("accepts a name with a combining accent", () => {
    expect(safeAssetPath(["café.png"])).toBe("café.png");
  });

  it("rejects a segment that ends in a space", () => {
    expect(safeAssetPath(["brand ", "logo.png"])).toBeUndefined();
  });

  it("rejects a segment that ends in a dot", () => {
    expect(safeAssetPath(["logo.png."])).toBeUndefined();
  });

  it("rejects a segment that starts with a space", () => {
    expect(safeAssetPath([" logo.png"])).toBeUndefined();
  });

  it("rejects an encoded backslash", () => {
    expect(safeAssetPath(["..%5Cproject.json"])).toBeUndefined();
  });

  it("rejects a Windows-reserved character", () => {
    expect(safeAssetPath(["a%3Ab.png"])).toBeUndefined();
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

describe("assetSegments for a reference relative to the project", () => {
  it("drops the leading assets/ folder", () => {
    expect(assetSegments("assets/brand-logo.png")).toEqual(["brand-logo.png"]);
  });
});

describe("assetSegments under a project whose slug is assets", () => {
  it("does not mistake the slug for the folder in a project path", () => {
    // Arrange
    const ref = "/projects/assets/assets/brand/a.png";

    // Act
    const segments = assetSegments(ref);

    // Assert
    expect(segments).toEqual(["brand", "a.png"]);
  });

  it("does not mistake the slug for the folder in an API URL", () => {
    // Arrange
    const ref = "/api/projects/assets/assets/a.png";

    // Act
    const segments = assetSegments(ref);

    // Assert
    expect(segments).toEqual(["a.png"]);
  });

  it("keeps a bare file name as it is", () => {
    // Arrange
    const ref = "logo.png?v=2";

    // Act
    const segments = assetSegments(ref);

    // Assert
    expect(segments).toEqual(["logo.png"]);
  });
});

describe("projectAssetUrl", () => {
  it("encodes each segment but keeps the subfolder slashes", () => {
    expect(projectAssetUrl("acme", "brand/mi logo.png")).toBe(
      "/api/projects/acme/assets/brand/mi%20logo.png",
    );
  });
});
