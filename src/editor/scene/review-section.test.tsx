// @vitest-environment jsdom
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TextEl } from "../../components/text/descriptor.ts";
import { defaultElement, defaultScene, type Scene } from "../../model/model.ts";
import { createCtx } from "../../service/ctx.ts";
import { fakeRenderer } from "../../service/fake-renderer.ts";
import { registry } from "../../service/tools/index.ts";
import { ReviewSection } from "./review-section.tsx";

afterEach(cleanup);

/** A scene with one text drawn in a font no project installs. */
function sceneWithMissingFont(): Scene {
  const text = {
    ...(defaultElement("text") as TextEl),
    id: "title",
    font: "Montserrat",
  };
  return { ...defaultScene(), elements: [text] };
}

/** What `scene_validate` answers for `scene` in a fresh project. */
async function toolNotices(scene: Scene): Promise<unknown> {
  const root = await mkdtemp(join(tmpdir(), "lienzo-review-"));
  await mkdir(join(root, "presets", "animations"), { recursive: true });
  const ctx = createCtx(root, fakeRenderer());
  await registry.call("project_create", { project: "p", name: "P" }, ctx);
  const res = await registry.call(
    "scene_validate",
    { project: "p", data: scene },
    ctx,
  );
  return res.ok ? (res.value as { notices?: string[] }).notices : res.error;
}

describe("editor notices (063/R8)", () => {
  it("lists the same notices scene_validate returns", async () => {
    // Arrange
    const scene = sceneWithMissingFont();
    const expected = await toolNotices(scene);

    // Act
    render(
      <ReviewSection
        scene={scene}
        fonts={[{ family: "Inter", weight: 400 }]}
      />,
    );

    // Assert
    const shown = [...document.querySelectorAll(".notice")].map(
      (n) => n.textContent,
    );
    // jsdom has no canvas, so the width is estimated here too (064/R4): missing font + estimate
    expect(shown).toHaveLength(2);
    expect(shown).toEqual(expected);
  });

  it("selects the element a notice names when it is clicked", () => {
    // Arrange
    const onSelect = vi.fn();
    render(
      <ReviewSection
        scene={sceneWithMissingFont()}
        fonts={[{ family: "Inter", weight: 400 }]}
        onSelect={onSelect}
      />,
    );

    // Act
    const [missingFont] = screen.getAllByTitle("Seleccionar el elemento");
    fireEvent.click(missingFont as HTMLElement);

    // Assert
    expect(onSelect).toHaveBeenCalledWith("title");
  });
});
