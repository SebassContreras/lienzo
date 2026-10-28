import { readFile } from "node:fs/promises";
import { relative, sep } from "node:path";
import type { Plugin } from "vite";
import { SCENE_CHANGED, type SceneChanged } from "../../model/scene-changed.ts";

type SceneChange = { project: string; name: string };

/** `{ project, name }` for `<root>/projects/<slug>/scenes/<name>.json`, else undefined. */
export function sceneChangeOf(
  root: string,
  path: string,
): SceneChange | undefined {
  const parts = relative(root, path).split(sep);
  if (parts.length !== 4) return undefined;
  const [projects, project, scenes, file] = parts;
  if (projects !== "projects" || scenes !== "scenes") return undefined;
  if (!project || !file?.endsWith(".json")) return undefined;
  const name = file.slice(0, -".json".length);
  return name ? { project, name } : undefined;
}

/**
 * Sends `lienzo:scene-changed` with the file's text whenever a project scene is written
 * (050/D1). Uses the dev server's own watcher, so a server started with `watch: null` (the
 * MCP renderer) sends nothing.
 */
export function sceneWatch(root: string): Plugin {
  return {
    name: "scene-watch",
    configureServer(server) {
      const send = (path: string) => {
        const change = sceneChangeOf(root, path);
        if (!change) return;
        readFile(path, "utf8")
          .then((text) =>
            server.hot.send({
              type: "custom",
              event: SCENE_CHANGED,
              data: { ...change, text } satisfies SceneChanged,
            }),
          )
          .catch(() => {}); // removed again before it could be read
      };
      server.watcher.on("add", send);
      server.watcher.on("change", send);
    },
  };
}
