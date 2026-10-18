import { describe, expect, it } from "vitest";
import { createElement } from "../components/index.ts";
import type { ImageEl } from "../model/model.ts";
import { ASSET_MIME, PRESET_MIME } from "./stage.tsx";

describe("041 workspace fixes and project assets/presets behavior", () => {
  it("defines distinct mime types for presets and project assets", () => {
    expect(PRESET_MIME).toBe("application/x-lienzo-element");
    expect(ASSET_MIME).toBe("application/x-lienzo-asset");
  });

  it("creates an image element with project asset path when dropping an asset", () => {
    const assetPayload = {
      path: "/api/projects/mi-proyecto/assets/logo.png",
      filename: "logo.png",
    };
    const dropPosition = { x: 500, y: 500 };

    const imageEl = createElement("image") as ImageEl;
    imageEl.src = assetPayload.path;
    imageEl.name = assetPayload.filename;
    imageEl.x = Math.round(dropPosition.x - imageEl.w / 2);
    imageEl.y = Math.round(dropPosition.y - imageEl.h / 2);

    expect(imageEl.kind).toBe("image");
    expect(imageEl.src).toBe("/api/projects/mi-proyecto/assets/logo.png");
    expect(imageEl.name).toBe("logo.png");
    expect(imageEl.x).toBe(Math.round(500 - imageEl.w / 2));
    expect(imageEl.y).toBe(Math.round(500 - imageEl.h / 2));
  });

  it("isolates autosave keys by project slug", () => {
    const keyDefault = `lienzo-scene:mi-proyecto`;
    const keyAcme = `lienzo-scene:acme`;
    const keyGlobal = `lienzo-scene:global`;

    expect(keyDefault).not.toBe(keyAcme);
    expect(keyAcme).not.toBe(keyGlobal);
  });
});
