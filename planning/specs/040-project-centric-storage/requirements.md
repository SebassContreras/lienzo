# 040 — project-centric-storage — Requirements

Centralize all scenes, assets, audio voiceovers, and exports strictly inside project workspaces (`projects/<slug>/`), deprecating and removing root-level `scenes/`, `assets/`, and `exports/` folders. Provide a default versioned project workspace `projects/mi-proyecto/`, establish a strict boundary preventing assets from leaking or cross-contaminating between projects, and guarantee that MCP/CLI tools and the web editor operate with a Project-First mentality.

- R1@1: A default workspace exists at `projects/mi-proyecto/` containing `project.json`, `scenes/ejemplo-keyframes.json`, `assets/`, and `presets/`. `projects/mi-proyecto/` is the only project workspace committed to version control.
- R2@1: Root-level `scenes/`, `assets/`, and `exports/` directories are removed from the repository and Git. User scenes and assets (e.g. `sebas-contreras`) are migrated into their respective `projects/<slug>/` directories.
- R3@1: All service and MCP/CLI tools (`scene_create`, `scene_build`, `scene_export`, `scene_preview`, `scene_get`, `scene_list`, `scene_generate_speech`, `element_add`) operate within a target project scope, defaulting to `mi-proyecto` if no project slug is specified.
- R4@1: Strict workspace boundary enforcement: agents and tools can only read, write, and reference assets within the designated target project. Referencing or borrowing assets from other projects is rejected with an actionable error.
- R5@1: The web editor shell and Vite middleware operate project-first, defaulting to the active project (`mi-proyecto` if none is selected), routing scene save/open and asset upload/serve operations directly to the project directory.
- R6@1: Version control (`.gitignore`) and agent instructions (`AGENTS.md`, `README.md`, `planning/architecture.md`) are updated to reflect the project-centric architecture and strict isolation rules.
