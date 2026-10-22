# 044 — nested-asset-drag — Requirements

No asset can be dragged onto the scene. Cause: the project inventory lists `assets/` one level
deep, so projects that keep files in subfolders (`assets/brand/profile.jpg`) show only folder
names (not images, so not draggable), and the asset GET route only serves flat file names.

- R1@1: The Recursos tab lists every asset file under `projects/<slug>/assets/`, including subfolders, by its relative path.
- R2@1: Every image asset (png, jpg, jpeg, webp, svg) in the tab can be dragged onto the canvas and becomes an `image` element at the drop point that renders the file.
- R3@1: Dropping keeps the image's aspect ratio (natural size fitted to the default image box).
- R4@1: Asset paths with `..` or absolute segments are rejected.
