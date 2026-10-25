# JOBBY Port Nine — Cargo Yard Map

Standalone repository for extracting and adapting the **PORT NINE** cargo-container map into JOBBY WORLD.

## Current contents

- `src/arenas/a03_cargoyard.js` — complete original map-generation source (cargo-container maze, crane, ship, warehouse, ramps and walkways).
- `LICENSE` — original MIT license and copyright notice.

## Important: integration status

This is the **original map source**, not a standalone runnable game. Its exported `build(ctx)` function requires the original game's arena context (materials, procedural props, deterministic random, collision proxies and scene helpers). It cannot yet run directly on GitHub Pages or inside JOBBY WORLD.

## Next steps

1. Adapt `build(ctx)` to a small independent Three.js map runtime, retaining map geometry and collision proxies.
2. Reduce material/texture cost, draw calls and shadows for mobile devices.
3. Add a map-only preview for mobile testing.
4. Export or adapt the geometry/collisions to JOBBY WORLD without replacing existing characters, touch controls, multiplayer or voice chat.

## Attribution

Port Nine is extracted from [hide-and-seek-arena](https://github.com/twalkerallenii-spec/hide-and-seek-arena), © 2026 twalkerallenii-spec, MIT license. Keep the original copyright and permission notice in redistributed copies.
