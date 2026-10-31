import { cp, mkdir, mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { type Ctx, createCtx } from "../core/ctx.ts";
import { fakeRenderer } from "../render/fake-renderer.ts";
import { registry } from "../tools/index.ts";

const project = "marca";
let root: string;
let ctx: Ctx;

const call = (tool: string, input: Record<string, unknown>) =>
  registry.call(tool, input, ctx);

const value = async (tool: string, input: Record<string, unknown>) => {
  const result = await call(tool, input);
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value as Record<string, unknown>;
};

const codeOf = async (tool: string, input: Record<string, unknown>) => {
  const result = await call(tool, input);
  return result.ok ? "ok" : result.error.code;
};

const guideFile = () => join(root, "projects", project, "brand.md");
const manifestFile = () => join(root, "projects", project, "project.json");
const fileExists = (path: string) =>
  stat(path).then(
    () => true,
    () => false,
  );

const GUIDE = "# Marca\r\n\nTono cercano.\n";
const emoji = "😀"; // 2 UTF-16 code units

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "lienzo-guide-"));
  await cp("presets/built-in", join(root, "presets", "built-in"), {
    recursive: true,
  });
  await mkdir(join(root, "presets", "animations"), { recursive: true });
  ctx = createCtx(root, fakeRenderer());
});

describe("brand guide on project_create", () => {
  it.each([
    { label: "absent", guide: undefined, stored: null },
    { label: "null", guide: null, stored: null },
    { label: "empty string", guide: "", stored: null },
    { label: "whitespace only", guide: "  \n", stored: "  \n" },
    { label: "normal text", guide: GUIDE, stored: GUIDE },
    {
      label: "19 999 units",
      guide: "a".repeat(19_999),
      stored: "a".repeat(19_999),
    },
    {
      label: "20 000 units",
      guide: "a".repeat(20_000),
      stored: "a".repeat(20_000),
    },
    {
      label: "20 000 units with emoji",
      guide: `${"a".repeat(19_998)}${emoji}`,
      stored: `${"a".repeat(19_998)}${emoji}`,
    },
  ])("stores $label and returns it as stored", async ({ guide, stored }) => {
    const created = await value("project_create", {
      project,
      name: "Marca",
      guide,
    });
    const inspected = await value("project_inspect", { project });

    expect([
      created.guide,
      inspected.guide,
      await fileExists(guideFile()),
    ]).toEqual([stored, stored, stored !== null]);
  });

  it.each([
    { label: "20 001 units", guide: "a".repeat(20_001) },
    {
      label: "20 000 units plus one emoji",
      guide: `${"a".repeat(19_999)}${emoji}`,
    },
  ])(
    "refuses $label with guide_too_long and creates nothing",
    async ({ guide }) => {
      const code = await codeOf("project_create", {
        project,
        name: "Marca",
        guide,
      });

      expect([code, await fileExists(join(root, "projects", project))]).toEqual(
        ["guide_too_long", false],
      );
    },
  );
});

describe("brand guide on project_update", () => {
  beforeEach(async () => {
    await value("project_create", { project, name: "Marca", guide: GUIDE });
  });

  it.each([
    { label: "absent keeps it", guide: undefined, stored: GUIDE },
    { label: "null deletes it", guide: null, stored: null },
    { label: "empty string deletes it", guide: "", stored: null },
    {
      label: "new text replaces it",
      guide: "Otra guía\n",
      stored: "Otra guía\n",
    },
  ])("$label", async ({ guide, stored }) => {
    const updated = await value("project_update", {
      project,
      name: "M",
      guide,
    });
    const inspected = await value("project_inspect", { project });

    expect([updated.guide, inspected.guide]).toEqual([stored, stored]);
  });

  it("round-trips the text exactly, line endings included", async () => {
    expect(await readFile(guideFile(), "utf8")).toBe(GUIDE);
  });

  it.each([
    { label: "a guide too long", input: { guide: "a".repeat(20_001) } },
    {
      label: "a guide too long and an invalid palette",
      input: { guide: "a".repeat(20_001), palette: { primary: "rojo" } },
    },
  ])("writes neither file on $label", async ({ input }) => {
    const before = [
      await readFile(guideFile(), "utf8"),
      await readFile(manifestFile(), "utf8"),
    ];

    const code = await codeOf("project_update", {
      project,
      name: "Nuevo",
      ...input,
    });

    expect([
      code === "ok",
      await readFile(guideFile(), "utf8"),
      await readFile(manifestFile(), "utf8"),
    ]).toEqual([false, ...before]);
  });
});
