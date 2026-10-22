# 044 — nested-asset-drag — Requirements

No asset can be dragged onto the scene. Cause: the project inventory lists `assets/` one level
deep, so projects that keep files in subfolders (`assets/brand/profile.jpg`) show only folder
names (not images, so not draggable), and the asset GET route only serves flat file names.

- R1@1: The Recursos tab lists every asset file under `projects/<slug>/assets/`, including subfolders, by its relative path.
- R2@1: Every image asset (png, jpg, jpeg, webp, svg) in the tab can be dragged onto the canvas and becomes an `image` element at the drop point that renders the file.
- R3@1: Dropping keeps the image's aspect ratio (natural size fitted to the default image box).
- R4@1: Asset paths with `..` or absolute segments are rejected.
- R5@1: A nested asset reference (`/api/projects/<slug>/assets/brand/profile.jpg`) passes the project's asset validation, so scenes that use it save and export.
- R6@1: The Recursos tab browses `assets/` by folder: it opens at the root, shows each subfolder as a folder tile with its file count and the files of the current folder by their file name, a folder tile opens that folder, and a breadcrumb goes back to any parent.
- R7@1: Asset names with spaces, accents and common punctuation (`CAPS move/01 - Close-up (front).png`, `after sun & tan`) are served, shown and draggable like any other asset; R4 still holds.
