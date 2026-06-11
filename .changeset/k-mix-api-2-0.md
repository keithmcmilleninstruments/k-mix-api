---
'k-mix-api': major
---

2.0.0 — full modernization with feature parity.

- Rewritten in TypeScript (strict, ESM-only) with shipped type declarations.
- Adopts `midi-ports` for cross-platform port resolution, hot-plug, and
  not-found tracking, replacing the bespoke port-detection logic.
- New toolchain: pnpm, tsup (ESM-only build), Biome, Vitest (first test suite),
  Changesets, and GitHub Actions CI/release via npm Trusted Publisher (OIDC).
- Removes 11 runtime dependencies (eventemitter3, camelcase, 8 lodash.*
  micro-packages) in favor of `midi-ports` plus small typed helpers.

Behavior fixes carried by the rewrite:
- Timed raw sends (`send([...], time)`) now honor the timestamp (previously
  dropped).
- The inbound Control Surface listener is re-attached on hot-plug, so input
  events keep working after a disconnect/reconnect.
- `connected`/`disconnected` are now edge-triggered (fire once on the transition
  into all-connected / all-disconnected) instead of re-emitting on every port
  state change.

Breaking: the package is now ESM-only; the UMD/IIFE CDN builds and the
`jsdelivr`/`unpkg` entry points are removed. The previously-undocumented
internal `connectionerror` event (emitted for unrecognized K-Mix port-name
variants) is no longer emitted; port matching is handled by `midi-ports`.
