# 048 — image-trim — Requirements

PNG assets often carry wide transparent margins, so the image box is much larger than what
is visible and hard to place. The editor gets an automatic trim and a manual crop, both
non-destructive.

- R1@1: With one image selected, "Recortar transparencia" in the inspector crops the image to its visible pixels (alpha above a small threshold); the visible content does not move or change scale on the canvas.
- R2@1: A manual crop mode (double-click on the image, or "Recortar manualmente" in the inspector) shows one handle per side; dragging a handle changes which part of the picture is shown without stretching it. Esc or a click outside the image leaves the mode.
- R3@1: "Quitar recorte" shows the whole picture again, keeping the on-canvas scale.
- R4@1: Cropping never modifies the asset file; the crop is saved with the scene and the export draws the same pixels as the editor. Scenes saved without a crop open unchanged.
- R5@1: A fully transparent or undecodable image is left as it is, with a status message.
