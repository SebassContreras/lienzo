import { describe, expect, it } from "vitest";
import { parseProjectManifest } from "../model/project.ts";
import { slugify } from "./dialogs/brand-manager-dialog.tsx";

describe("Brand Manager workflow and validation", () => {
  it("generates URL-safe slugs with slugify", () => {
    expect(slugify("Acme Studios")).toBe("acme-studios");
    expect(slugify("Diseño & Animación 2026!")).toBe("diseno-animacion-2026");
    expect(slugify("---Brand---Test---")).toBe("brand-test");
    expect(slugify("Café con Leche")).toBe("cafe-con-leche");
  });

  it("validates full brand configuration with palette and canvas defaults", () => {
    const rawConfig = {
      slug: "studio-x",
      name: "Studio X",
      description: "Agencia de animación y branding",
      palette: {
        primary: "#ff3366",
        secondary: "#22d3ee",
        accent: "#f59e0b",
        surface: "#1e1e24",
        background: "#09090b",
        text: "#fafafa",
        custom: ["#a855f7", "#ec4899"],
      },
      canvas: {
        width: 1920,
        height: 1080,
        fps: 60,
        duration: 10,
      },
      fonts: [{ family: "Inter", role: "body", weights: [400, 600] }],
    };

    const res = parseProjectManifest(rawConfig);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.manifest.palette.primary).toBe("#ff3366");
      expect(res.manifest.palette.custom).toEqual(["#a855f7", "#ec4899"]);
      expect(res.manifest.canvas.width).toBe(1920);
      expect(res.manifest.canvas.fps).toBe(60);
    }
  });

  it("rejects invalid slugs in brand configuration", () => {
    const invalidConfig = {
      slug: "invalid slug with spaces",
      name: "Studio Bad",
    };
    const res = parseProjectManifest(invalidConfig);
    expect(res.ok).toBe(false);
  });
});
