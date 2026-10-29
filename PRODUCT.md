# Product Vision & Scope

This document defines the product purpose, target audience, core user problems, and functional boundaries. AI agents must consult this document to understand the *why* and *what* before proposing features or modifying scope.

---

## 1. Value Proposition & Vision

Lienzo is a free-form canvas editor for animated social media posts. You drag pre-made components (cards, text, connecting lines) onto a canvas, edit each one live (shape, fill, border, glow, shadow, text, animation) and export the result as PNG, GIF or MP4. It is made for posts that explain things visually, such as a data flow or how a system is wired.

- Components are drawn on a 2D canvas, not as React components, so what you see while editing is exactly what gets exported.
- Any configured element can be saved as a preset: a JSON file that shows up in the library and can be dropped again.
- Scenes (whole posts) are JSON files too.
- License: MIT. Zero cost. Runs locally.

Done when:

1. A user builds the "how MCP works" demo post from the library by dragging and editing components, without writing code.
2. The same post exports to PNG, a seamlessly looping GIF and an MP4.
3. A configured element saved as a preset can be dropped into another scene.

Phase 2: a CLI and an MCP server built on one service layer let scripts and AI agents create, edit and export scenes (done: every editor save has a tool).

Since then: project workspaces with a brand guide, palette, fonts and canvas defaults (`projects/<project>/`); shots, camera and symbols for short videos; voice-over through text-to-speech with synced subtitles and audio tracks.

---

## 2. Target Audience & Personas

- **Primary Persona:** creators who explain technical topics on social media (the maintainer first).

---

## 3. Core Problems Solved

| Problem | How This Product Solves It |
|---|---|
| A post that explains a data flow or a system needs to be built visually, without writing code | Pre-made components dragged onto a canvas and edited live. |
| What the editor shows differs from what is exported | Components are drawn on a 2D canvas by one drawing path, so the preview is the export. |
| A configured element has to be rebuilt for the next post | Any element can be saved as a preset and dropped into another scene. |
| Scripts and AI agents cannot drive a graphical editor | A CLI and an MCP server over one service layer; every editor save has a tool. |

---

## 4. Key Functional Capabilities

1. **Canvas editing:** drag components, edit shape, fill, border, glow, shadow, text and animation live.
2. **Export:** PNG, a seamlessly looping GIF and MP4.
3. **Presets and scenes:** presets and scenes are JSON files, reusable across scenes.
4. **Project workspaces:** `projects/<project>/` with a brand guide, palette, fonts and canvas defaults.
5. **Short videos:** shots, camera and symbols; voice-over through text-to-speech with synced subtitles and audio tracks.
6. **Automation:** a CLI and an MCP server built on one service layer, usable by scripts and AI agents.

---

## 5. Non-Goals & Boundaries

- Accounts, cloud hosting, collaboration, publishing to social networks.
- Audio editing beyond placing voice-over and audio tracks on the timeline.
