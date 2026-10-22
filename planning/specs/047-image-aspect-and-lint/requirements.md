# 047 — image-aspect-and-lint — Requirements

After 044/T013 a dropped asset stores its own aspect ratio, but images saved before it still
carry the 4/3 default, so a corner resize stretches them. Biome also reports 33 warnings
(non-null assertions) that hide new ones.

- R1@1: Opening a scene corrects the stored aspect ratio of every image (groups included) whose picture can be decoded; the scene's layout (`x`, `y`, `w`, `h`) is unchanged and no undo step is added.
- R2@1: `pnpm lint` reports no warnings.
