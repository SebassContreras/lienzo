/**
 * Storage adapter and interface for Project Workspaces (031/R2, 031/R3, 031/D2).
 * Isolates filesystem operations under `projects/<slug>/` behind an injectable interface.
 */
import {
  access,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { join, relative } from "node:path";
import {
  type ParseProjectResult,
  type ProjectConfig,
  type ProjectManifest,
  ProjectSlugSchema,
  parseProjectManifest,
} from "../../model/project.ts";
import { assetSegments, safeAssetPath } from "../assets/asset-path.ts";

export type ProjectSummary = {
  slug: string;
  name: string;
  description?: string;
  palettePrimary: string;
  updatedAt?: string;
};

export type ProjectDetails = {
  manifest: ProjectManifest;
  assets: string[];
  presets: string[];
  scenes: string[];
};

export type ProjectStore = {
  /** Enumerate all valid project workspaces on disk. */
  list(): Promise<ProjectSummary[]>;

  /** Inspect full project details (manifest + assets/presets/scenes inventory). */
  get(slug: string): Promise<ProjectDetails | undefined>;

  /** Create a new project workspace directory and write initial project.json. */
  create(slug: string, config: ProjectConfig): Promise<ProjectManifest>;

  /** Update an existing project's manifest (project.json). */
  update(
    slug: string,
    config: Partial<ProjectConfig>,
  ): Promise<ProjectManifest>;

  /** Delete a project workspace directory cleanly. */
  delete(slug: string): Promise<boolean>;

  /** Resolve the absolute filesystem path to a project subfolder (assets, presets, scenes). */
  resolvePath(
    slug: string,
    subfolder?: "assets" | "presets" | "scenes",
  ): string;

  /** Create a Store scoped to a project workspace (projects/<slug>/) with fallback to global built-ins. */
  projectStore(slug: string): Promise<import("../store.ts").Store>;

  /**
   * Validates whether an asset file reference belongs to the project's local assets.
   * Returns a warning notice if the asset is missing from the project.
   */
  checkAsset(
    slug: string,
    assetRef: string,
  ): Promise<{ ok: boolean; warning?: string }>;
};

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export function createProjectStore(root: string): ProjectStore {
  const projectsDir = join(root, "projects");

  const projectPath = (slug: string) => join(projectsDir, slug);
  const manifestPath = (slug: string) =>
    join(projectPath(slug), "project.json");

  return {
    resolvePath(slug: string, subfolder?: "assets" | "presets" | "scenes") {
      const base = projectPath(slug);
      return subfolder ? join(base, subfolder) : base;
    },

    async list(): Promise<ProjectSummary[]> {
      if (!(await exists(projectsDir))) return [];
      const entries = await readdir(projectsDir, { withFileTypes: true });
      const summaries: ProjectSummary[] = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const slug = entry.name;
        const mPath = manifestPath(slug);
        if (!(await exists(mPath))) continue;

        try {
          const raw = JSON.parse(await readFile(mPath, "utf8"));
          const parsed = parseProjectManifest(raw);
          if (parsed.ok) {
            summaries.push({
              slug: parsed.manifest.slug,
              name: parsed.manifest.name,
              description: parsed.manifest.description,
              palettePrimary: parsed.manifest.palette.primary,
              updatedAt: parsed.manifest.updatedAt,
            });
          }
        } catch {
          // Ignore damaged project manifests in list view
        }
      }

      return summaries.sort((a, b) => a.name.localeCompare(b.name));
    },

    async get(slug: string): Promise<ProjectDetails | undefined> {
      ProjectSlugSchema.parse(slug);
      const base = projectPath(slug);
      const mPath = manifestPath(slug);
      if (!(await exists(mPath))) return undefined;

      const raw = JSON.parse(await readFile(mPath, "utf8"));
      const parsed: ParseProjectResult = parseProjectManifest(raw);
      if (!parsed.ok) {
        throw new Error(`Manifiesto de proyecto dañado: ${parsed.error}`);
      }

      const listDir = async (sub: string) => {
        const d = join(base, sub);
        if (!(await exists(d))) return [];
        return (await readdir(d)).filter((f) => !f.startsWith("."));
      };

      // Assets may sit in subfolders (044/D1): every file, by its POSIX path relative to assets/.
      const listAssets = async () => {
        const d = join(base, "assets");
        if (!(await exists(d))) return [];
        const entries = await readdir(d, {
          recursive: true,
          withFileTypes: true,
        });
        return entries
          .filter((e) => e.isFile())
          .map((e) =>
            relative(d, join(e.parentPath, e.name)).replace(/\\/g, "/"),
          )
          .filter(
            (path) => !path.split("/").some((part) => part.startsWith(".")),
          )
          .sort();
      };

      const [assets, presets, scenes] = await Promise.all([
        listAssets(),
        listDir("presets").then((files) =>
          files.filter((f) => f.endsWith(".json")),
        ),
        listDir("scenes"),
      ]);

      return {
        manifest: parsed.manifest,
        assets,
        presets,
        scenes,
      };
    },

    async create(
      slug: string,
      config: ProjectConfig,
    ): Promise<ProjectManifest> {
      ProjectSlugSchema.parse(slug);
      const base = projectPath(slug);

      if (await exists(base)) {
        throw new Error(`El proyecto «${slug}» ya existe`);
      }

      const now = new Date().toISOString();
      const manifest: ProjectManifest = {
        ...config,
        slug,
        createdAt: now,
        updatedAt: now,
      };

      // Create clean isolated structure: project.json, assets/, presets/, scenes/
      await mkdir(join(base, "assets"), { recursive: true });
      await mkdir(join(base, "presets"), { recursive: true });
      await mkdir(join(base, "scenes"), { recursive: true });

      await writeFile(
        manifestPath(slug),
        `${JSON.stringify(manifest, null, 2)}\n`,
        "utf8",
      );
      return manifest;
    },

    async update(
      slug: string,
      config: Partial<ProjectConfig>,
    ): Promise<ProjectManifest> {
      ProjectSlugSchema.parse(slug);
      const current = await this.get(slug);
      if (!current) {
        throw new Error(`No existe el proyecto «${slug}»`);
      }

      const updated: ProjectManifest = {
        ...current.manifest,
        ...config,
        slug,
        updatedAt: new Date().toISOString(),
      };

      await writeFile(
        manifestPath(slug),
        `${JSON.stringify(updated, null, 2)}\n`,
        "utf8",
      );
      return updated;
    },

    async delete(slug: string): Promise<boolean> {
      ProjectSlugSchema.parse(slug);
      const base = projectPath(slug);
      if (!(await exists(base))) return false;

      await rm(base, { recursive: true, force: true });
      return true;
    },

    async projectStore(slug: string): Promise<import("../store.ts").Store> {
      ProjectSlugSchema.parse(slug);
      const base = projectPath(slug);
      if (!(await exists(base))) {
        throw new Error(`No existe el proyecto «${slug}»`);
      }
      const { createStore } = await import("../store.ts");
      const { listJson } = await import("../../presets/json-fs.ts");
      const globalStore = createStore(root);
      const projectPresetsDir = join(base, "presets");
      const projectScenesDir = join(base, "scenes");
      const projectAnimDir = join(projectPresetsDir, "animations");

      return {
        presets: async () => {
          const globalBuiltIns = (await globalStore.presets()).filter(
            (p) => p.source === "built-in",
          );
          const localPresets = (await listJson(projectPresetsDir)).map((i) => ({
            file: i.name,
            source: "user" as const,
            data: i.data,
          }));
          return [...globalBuiltIns, ...localPresets];
        },
        animPresets: async () => {
          const localAnims = await listJson(projectAnimDir);
          const globalAnims = await globalStore.animPresets();
          return [...localAnims, ...globalAnims];
        },
        scenes: () => listJson(projectScenesDir),
        readScene: async (name) => {
          const { readJson } = await import("../../presets/json-fs.ts");
          return readJson(projectScenesDir, name);
        },
        writeScene: async (name, scene) => {
          const { writeJson } = await import("../../presets/json-fs.ts");
          return writeJson(projectScenesDir, name, scene);
        },
      };
    },

    async checkAsset(
      slug: string,
      assetRef: string,
    ): Promise<{ ok: boolean; warning?: string }> {
      ProjectSlugSchema.parse(slug);
      const normalized = assetRef.trim().replace(/\\/g, "/");

      // Reject foreign project references: e.g. /projects/other/assets/* or /api/projects/other/assets/*
      const foreignMatch = normalized.match(
        /(?:^|\/)(?:api\/)?projects\/([^/]+)\/assets\//,
      );
      if (foreignMatch && foreignMatch[1] !== slug) {
        return {
          ok: false,
          warning: `Aislamiento estricto: el recurso «${assetRef}» pertenece a otro proyecto («${foreignMatch[1]}») y no puede usarse en «${slug}»`,
        };
      }

      // The whole path under assets/, subfolders included (044/D5).
      const assetPath = safeAssetPath(assetSegments(normalized));
      const assetFile =
        assetPath && join(projectPath(slug), "assets", assetPath);
      if (assetFile && (await exists(assetFile))) {
        return { ok: true };
      }
      return {
        ok: false,
        warning: assetPath
          ? `El recurso «${assetPath}» no existe en assets/ del proyecto «${slug}» (añádelo con asset_add)`
          : `«${assetRef}» no es una ruta válida dentro de assets/`,
      };
    },
  };
}
