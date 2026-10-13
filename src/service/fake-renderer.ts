/** A renderer for tests that never starts a browser: it returns a 1×1 PNG, or `type`. */
import type { Renderer } from "./renderer.ts";

const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

const TYPES = { png: "image/png", gif: "image/gif", mp4: "video/mp4" };

export function fakeRenderer(type?: string): Renderer {
  return {
    render: async (_scene, options) => ({
      bytes: PIXEL,
      type: type ?? TYPES[options.format],
    }),
    dispose: async () => {},
  };
}
