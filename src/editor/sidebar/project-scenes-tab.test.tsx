// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultScene } from "../../model/model.ts";
import { ProjectScenesTab } from "./project-scenes-tab.tsx";

/** The project API (the boundary): each project answers with its own scene names. */
const SCENES: Record<string, string[]> = {
  acme: ["lanzamiento"],
  otro: ["promo-otro"],
};

function fakeProjectApi(url: string) {
  const slug = url.match(/\/api\/projects\/([^/]+)\/scenes/)?.[1] ?? "";
  const body = (SCENES[slug] ?? []).map((name) => ({
    name,
    data: defaultScene(),
  }));
  return Promise.resolve(new Response(JSON.stringify(body)));
}

function tab(projectSlug: string) {
  return (
    <ProjectScenesTab
      projectSlug={projectSlug}
      scene={defaultScene()}
      name="Mi proyecto"
      setName={() => {}}
      onOpen={() => {}}
      onBlank={() => {}}
      onRecoverDraft={() => {}}
      setStatus={() => {}}
    />
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(fakeProjectApi));
  // Thumbnails wait for web fonts, which jsdom does not have.
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { ready: Promise.resolve() },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ProjectScenesTab", () => {
  it("lists the scenes of the active project", async () => {
    render(tab("acme"));

    expect(await screen.findByText("lanzamiento")).toBeTruthy();
  });

  it("shows the new project's scenes after a project switch", async () => {
    const { rerender } = render(tab("acme"));
    await screen.findByText("lanzamiento");

    rerender(tab("otro"));

    expect(await screen.findByText("promo-otro")).toBeTruthy();
    expect(screen.queryByText("lanzamiento")).toBeNull();
  });
});
