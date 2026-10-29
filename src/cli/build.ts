/**
 * Dedicated build script for standalone CLI and MCP distribution (029/D1).
 * Packages `src/cli/main.ts` into `dist/cli.js` with shebang for Node >=24 ESM.
 */
import { build } from "esbuild";
import { gitCommit, gitDirty, stamp } from "../mcp/build-id.ts";

const root = process.cwd();
const built = {
  commit: gitCommit(root),
  dirty: gitDirty(root) ?? false,
  at: stamp(),
};

await build({
  entryPoints: ["src/cli/main.ts"],
  bundle: true,
  outfile: "dist/cli.js",
  format: "esm",
  platform: "node",
  target: "node24",
  banner: {
    js: "#!/usr/bin/env node",
  },
  packages: "external",
  // the server names this build in its `instructions` (072)
  define: { __LIENZO_BUILD__: JSON.stringify(built) },
  sourcemap: false,
});
