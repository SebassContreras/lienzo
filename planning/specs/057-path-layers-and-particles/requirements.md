# 057 — path-layers-and-particles — Requirements

Multiple `shapes` inside a `path` element always morph between one another instead of stacking as color layers, and `particles` elements only float in place with integer `speed >= 1`, preventing directional falling (rain, snow, leaves) or stationary twinkling stars.

> **GitHub Issue #2:** *particles cannot fall or stay still*
> `particles` only wander around their place (`drift`), and `speed` is an integer with a minimum of 1. Falling leaves, rain or snow are not possible, and still stars need `drift: 0` (`videos/viaje/learnings.md`).
> **Expected:** A direction/gravity option for falling particles, and a way to keep points still without a workaround (e.g. fractional speeds, `speed === 0`, and directional falling).

- R1@1: The `path` component supports `mode: "morph" | "layers"` (default `"morph"`); in `"layers"` mode, all `shapes` are drawn stacked in order within the same element box, each using its own `fill` and `stroke` overrides (falling back to the element's `fill` and `stroke`).
- R2@1: The `particles` component supports `motion: "drift" | "fall" | "static"` (default `"drift"`), `direction` in degrees (default `90` for downward in `"fall"`), `gravity` (`>= 0`), and `twinkle` (`0` to `1`, modulating per-particle opacity over time), and allows `speed >= 0` (including fractional speeds).
- R3@1: In `"static"` motion mode (or when `speed === 0`), particles stay at their deterministic seeded positions while still applying `twinkle` if configured; in `"fall"` mode, particles travel along `direction` with `gravity` and wrap seamlessly across the element bounds per loop cycle (A6).
- R4@1: Existing `path` and `particles` elements without the new fields render identically to before 057.
