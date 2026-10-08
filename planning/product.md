# Product

## What this is

Lienzo is a free-form canvas editor for animated social media posts. You drag pre-made
components (cards, text, connecting lines) onto a canvas, edit each one live (shape, fill,
border, glow, shadow, text, animation) and export the result as PNG, GIF or MP4. It is
made for posts that explain things visually, such as a data flow or how a system is wired.

- Components are drawn on a 2D canvas, not as React components, so what you see while
  editing is exactly what gets exported.
- Any configured element can be saved as a preset: a JSON file that shows up in the
  library and can be dropped again.
- Scenes (whole posts) are JSON files too.
- License: MIT. Zero cost. Runs locally.

Done when:

1. A user builds the "how MCP works" demo post from the library by dragging and editing
   components, without writing code.
2. The same post exports to PNG, a seamlessly looping GIF and an MP4.
3. A configured element saved as a preset can be dropped into another scene.

Phase 2: a CLI and an MCP server built on one service layer let scripts and AI agents
create, edit and export scenes.

## Who uses it

- **Creators** who explain technical topics on social media (the maintainer first).

## Out of scope

- Brand kits and templates.
- Accounts, cloud hosting, collaboration, publishing to social networks.
- Audio.
