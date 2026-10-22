# 049 — image-trim-service — Requirements

Agents build scenes through the MCP server and the CLI (029), so they need the same
automatic trim as the editor (048) without opening it.

- R1@1: The `image_trim` tool (`project`, `scene`, `id`) trims the transparent margin of an image element in a saved scene and saves it; the visible content keeps its place and scale, as in the editor.
- R2@1: `element_add` accepts `trim: true` for an image, which is trimmed before the scene is saved.
- R3@1: Both are available from the MCP server and the CLI, with the same input and result.
- R4@1: An image that cannot be decoded, or has no visible pixels, fails with an error on `id` and leaves the scene file unchanged; a non-image `id` fails with `invalid_input`.
