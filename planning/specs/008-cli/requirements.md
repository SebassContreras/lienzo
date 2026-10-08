# 008 — cli — Requirements

## What's being built

`pnpm lienzo`, a command line that runs any tool of the service layer (007).

## Who it serves

The maintainer and scripts.

## Requirements

- R1@1: `pnpm lienzo <tool>` runs any registry tool, with its input given as flags or as `--json`.
- R2@1: `pnpm lienzo --help` lists every tool and `pnpm lienzo <tool> --help` shows its fields, both generated from the registry.
- R3@1: The result is printed as JSON on stdout; an error goes to stderr with exit code 1.

## Dependencies

007.

## Owner split

All tasks agent.
