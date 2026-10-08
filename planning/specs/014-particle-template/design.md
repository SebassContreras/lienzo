# 014 — particle-template — Design

## Approach

- D1@1 (implements R1, R4): The particles descriptor gains `template: Element | null` (`null` keeps today's dot); each point draws the template through `drawElements` with translate, scale and rotate.
- D2@1 (implements R2): Per-point variation is derived from the seed, nothing random at draw time; spin uses whole turns per loop (A6).
- D3@1 (implements R3): The template is edited in an isolated editor mode: the same stage on a temporary scene holding only the template.
- D4@1 (implements R6): Presets are recipes (A19) with a template.

## Deliverables

Particles descriptor fields, draw changes, template edit mode, presets.
