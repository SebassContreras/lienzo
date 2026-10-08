# 016 — three-d — Requirements

## What's being built

A 3D element made with three.js: primitives or GLTF models, with material, lights and
camera, edited and animated like any other element.

## Who it serves

Creators who want a 3D object (a logo, a device, a shape) in an explainer post.

## Requirements

- R1@1: A 3D element shows a primitive (cube, sphere, torus, cylinder, cone, plane, 3D text) or a GLTF model (`.glb` from `assets/`).
- R2@1: Material (color, metalness, roughness, wireframe, emissive), lights (ambient, directional; color, intensity) and camera (field of view, position, target) are editable.
- R3@1: Model rotation, position and scale, and the camera, are animatable with preset animations (013) and keyframes (015).
- R4@1: It behaves like any element: box, layers, selection, presets and export; its background is transparent.
- R5@1: Rendering is deterministic: the same t gives the same pixels and the loop closes.

## Dependencies

012, 013, 015.

## Owner split

All tasks agent.
