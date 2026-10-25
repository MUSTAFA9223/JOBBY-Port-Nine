# JOBBY Port Nine — Mobile Cargo Yard

## Status

- `src/arenas/a03_cargoyard.js`: **unaltered original** PORT NINE map generator, licensed MIT. It requires the upstream game's `ctx` runtime and is not runnable alone.
- `index.html`: **independent lightweight Three.js prototype** of the cargo yard, **reconstructed from the source map's layout coordinates**, not a faithful full conversion of the 95 KB generator. Includes container maze, warehouse, ship, two cranes, walkways, simple collisions, touch joystick, jump, touch camera and keyboard controls.
- `LICENSE`: original copyright and MIT notice.

## Preview

The single-page prototype can be hosted as a static site. It loads Three.js from `esm.sh`, so an internet connection is needed. GitHub Pages must be enabled in repository Settings → Pages → Deploy from branch → main / root. The GitHub Pages URL, **once enabled and deployed**, should be `https://mustafa9223.github.io/JOBBY-Port-Nine/`.

## Remaining integration work

- Run real-device performance tests and correct any movement/collision issues.
- Convert additional authored objects from original source and optimize draw calls (the current preview creates many meshes).
- Import adapted geometry into JOBBY WORLD's existing renderer and physics. Keep existing JOBBY avatars, touch input, multiplayer and voice chat.

## Original attribution

Source: https://github.com/twalkerallenii-spec/hide-and-seek-arena © 2026 twalkerallenii-spec, MIT license. Preserve the original license notice.
