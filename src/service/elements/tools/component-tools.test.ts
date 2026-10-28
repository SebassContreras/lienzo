import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { defineComponent } from "../../../components/descriptor.ts";
import { ellipse } from "../../../components/ellipse/descriptor.ts";
import { registerComponent } from "../../../components/index.ts";
import { applyTracks } from "../../../engine/tracks.ts";
import type { Element, Scene } from "../../../model/model.ts";
import { parseScene } from "../../../model/schema.ts";
import { type ToolHarness, toolHarness } from "../../../test/tool-harness.ts";

let h: ToolHarness;

beforeEach(async () => {
  h = await toolHarness();
});

const call = (name: string, input: unknown) => h.call(name, input);

const ok = (name: string, input: unknown) => h.ok(name, input);

async function onDisk(name: string): Promise<Scene> {
  const raw = await readFile(
    join(h.ctx.root, "projects", "mi-proyecto", "scenes", `${name}.json`),
    "utf8",
  );
  const parsed = parseScene(JSON.parse(raw));
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
}

describe("descriptor-driven tools", () => {
  it("handles a test-only kind with no tool change, and its keyframes play", async () => {
    registerComponent(
      defineComponent({ ...ellipse, kind: "blob", label: "Blob" } as never),
    );
    const kinds = (await ok("component_list", {})) as unknown as {
      kind: string;
      animatable: string[];
    }[];
    expect(kinds.find((k) => k.kind === "blob")?.animatable).toContain("x");
    await ok("scene_create", { scene: "s" });
    const { id } = await ok("element_add", { scene: "s", kind: "blob" });
    await ok("element_update", { scene: "s", id, patch: { w: 50 } });
    await ok("keyframe_set", { scene: "s", id, path: "x", t: 0, value: 0 });
    await ok("keyframe_set", { scene: "s", id, path: "x", t: 2, value: 100 });
    expect(
      await call("keyframe_set", {
        scene: "s",
        id,
        path: "nope",
        t: 0,
        value: 1,
      }),
    ).toMatchObject({ ok: false, error: { code: "unknown_path" } });
    const el = (await onDisk("s")).elements[0] as Element & { x: number };
    expect(el.kind).toBe("blob");
    expect((applyTracks(el, 1).el as typeof el).x).toBeCloseTo(50, 0);
    await ok("keyframe_remove", { scene: "s", id, path: "x", t: 2 });
    await ok("element_move", { scene: "s", id, to: 0 });
    await ok("element_remove", { scene: "s", id });
    expect((await onDisk("s")).elements).toEqual([]);
  });
});
