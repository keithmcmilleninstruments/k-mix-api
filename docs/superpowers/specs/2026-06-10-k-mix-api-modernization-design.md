# k-mix-api 2.0 — Modernization Design

**Date:** 2026-06-10
**Status:** Approved (pending spec review)
**Goal:** Bring `k-mix-api` up to the same engineering standard as the recently
modernized `midi-ports` package (its sibling/dependency), with **full feature
parity** to the current `1.5.0` JavaScript release.

---

## 1. Motivation

`k-mix-api` is a published browser library (`v1.5.0`, last touched 2022) that
gives full Web MIDI control of the Keith McMillen Instruments K-Mix. It is ~700
lines of untyped, untested plain JavaScript built with Rollup and Yarn classic,
with no CI, no changelog automation, and 11 runtime dependencies (8 of them
`lodash.*` micro-packages). It hand-rolls MIDI port detection that duplicates
what its sibling package `midi-ports` now does well.

This effort modernizes the toolchain, ports the code to TypeScript, adopts
`midi-ports` for port management, sheds the legacy dependencies, and adds the
package's first real test suite — **without dropping any existing capability.**

## 2. North Star: Feature Parity

The acceptance bar is **feature parity**, not signature-identity. We are free to
change structure, internals, and even API signatures, provided every capability
below is preserved. In practice we keep the documented public API
behavior-compatible because that is the safest way to guarantee parity.

### 2.1 Parity checklist (must all survive)

**Construction**
- `new KMIX(midi, userOptions = {}, debug = false)` — `midi` is a raw
  `MIDIAccess`; `userOptions` overrides defaults; `debug` is `false | true | 'state'`.
- Errors to console when the Control Surface input is absent (does not throw).

**Options**
- Full nested syntax: `"fader-1": { bank_1, bank_2, bank_3 }`,
  `"button-x": { bank_1, bank_2, bank_3, mode: 'momentary' | 'toggle' }`.
- Terse array syntax: `"fader-1": [1,1,1]`, `"button-x": [13,13,13,'momentary']`.
- `"midi-channels": [c1, c2, c3]` selects the three MIDI-bank channels.
- User options are deep-merged over `KMIXDefaults`; omitted controls keep defaults.

**`send(control, value, bank = 1, time = 0)`** — all control-type routings:
- `raw`: `send([176,1,127], time)` → Audio Control output.
- `raw-control`: `send('control', [176,1,127], time)` → Control Surface output.
- `control`: `send('control:button-vu', 0)` → Control Surface output, message
  built from options + bank.
- `raw-expander`: `send('expander', [..])` → Expander output.
- `expander`: `send('expander:..', [..])` → Expander output.
- `input` / `main` / `misc` / `preset`: e.g. `send('fader:1', value, time)`,
  `send('main:x', v)`, `send('preset', n)` → Audio Control output, message built
  from the CC tables. `preset` uses program-change (`192 + channel - 1`).
- Timestamped send (`output.send(message, now + time)`), short-message warning.

**`isConnected(port = 'all')`** — `'all' | 'audio-control' | 'control-surface' | 'expander'`.

**`help(request)`** — `'input' | 'main' | 'misc' | 'control'` (console.table output).

**Events (via the EventEmitter base)**
- `'connected'` when all ports are connected; `'disconnected'` when all are gone.
- Per-control events named for the control, e.g. `'fader-1'`, `'button-vu'`,
  with payload `{ channel, value, raw }`.
- `':off'` variant for note-off (`128`), e.g. `'button-vu:off'`.
- `'any'` event with payload `{ control, channel, value, raw }`.
- `'connectionerror'` for an unrecognized K-Mix port name.
- Standard emitter surface: `on` / `off` / `once` / `emit` / `listeners`.

**Debug**
- `debug === true` → formatted per-message console logging (Audio Control port
  omits the `control` field and reports channel from `data[7]`).
- `debug === 'state'` → logs port state-change objects.

## 3. Tooling & Infrastructure (mirror `midi-ports`)

| Concern | From | To |
|---|---|---|
| Package manager | Yarn classic | **pnpm 11.5.3** (`packageManager` field) |
| Language | plain JS | **TypeScript 5**, strict, `noUncheckedIndexedAccess`, ESM-only |
| Build | Rollup → IIFE/ESM/UMD | **tsup** → ESM-only + `.d.ts` + sourcemaps |
| Lint/format | none | **Biome 2** (config copied from midi-ports) |
| Tests | manual `test/index.html` | **Vitest 4** + `@vitest/coverage-v8` |
| Release | manual `npm version` | **Changesets** + npm **Trusted Publisher (OIDC)** |
| CI | none | **GitHub Actions** `ci.yml` + `release.yml`, Node 24 |
| tsconfig | none | ES2022 / `Bundler` resolution (copied from midi-ports) |
| `pnpm-workspace.yaml` | none | `allowBuilds: { esbuild: true }` |

**Scripts** (match midi-ports): `build` (tsup), `dev` (tsup --watch), `test`
(vitest run), `test:watch`, `coverage`, `lint` (biome check), `format`,
`typecheck` (tsc --noEmit), `prepublishOnly`, `release` (changeset publish).

**Build output:** ESM-only. Drops the UMD/IIFE CDN builds and the
`jsdelivr`/`unpkg`/`umd`/`esm` package.json fields — a clean break appropriate
for the 2.0 major bump.

## 4. Source Architecture (TypeScript, `src/`)

Keep the modular split, ported to typed modules:

- `src/index.ts` — exports `KMIX` (default + named) and public types
  (`KmixOptions`, control/event types).
- `src/kmix.ts` — the `KMIX` class (construction, `send`, `isConnected`, `help`,
  wiring to `midi-ports`).
- `src/emitter.ts` — small **typed EventEmitter** base replacing `eventemitter3`
  (`on`/`off`/`once`/`emit`/`listeners`). Zero deps; preserves `kmix.on(...)`.
- `src/control-messages.ts` — typed port of `control-message.js`
  (`getControlType`, `controlMessage`, `findControl`, `findBank`).
- `src/build-message.ts` — typed port of `control-message-from-options.js`.
- `src/message-handler.ts` — typed port of `midiMessageHandler.js`.
- `src/defaults.ts` — `KMIXDefaults`.
- `src/control-tables.ts` — the CC lookup tables (`input_channel_params`, etc.).
- `src/help.ts` — typed port of `help.js`.
- `src/options.ts` — option conversion/merge helpers (`convertOptions`,
  `arraysToObject`, `deepMerge`).

(Final filenames may shift slightly during implementation; the boundaries are
what matter.)

## 5. Adopting `midi-ports`

The hand-rolled `storePortConnections` + `stateChangeHandler` + camelcase
port-name munging is **deleted** and replaced by `midi-ports` (direct runtime
dependency). Internally the constructor wraps the passed `MIDIAccess`:

```ts
import { createMidiPorts } from 'midi-ports'

const ports = createMidiPorts(midi, {
  devices: {
    'audio-control':   { ports: ['k-mix-audio-control'] },
    'control-surface': { ports: ['k-mix-control-surface'] },
    'expander':        { ports: ['k-mix-expander'] },
  },
})
```

- Port handles (`audioControl.output`, `controlSurface.input`, `expander.output`)
  come from `ports.get('k-mix-…')`, which exposes live `input`/`output`,
  `isConnected`, and a chainable `send`.
- `isConnected(...)` delegates to each `Port.isConnected` — same signature, same
  four selectors.
- `'connected'` / `'disconnected'`: subscribe to midi-ports
  `on('connect' | 'disconnect')`, recompute the aggregate, and emit with the
  current semantics (all-present → `connected`, all-absent → `disconnected`).
- **Bonus fix:** re-attach the Control Surface `onmidimessage` handler on
  hot-plug. The current code attaches once in the constructor, so input events
  stop working after a disconnect/reconnect.

This gives K-Mix cross-platform port naming, hot-plug, and not-found tracking for
free, and makes the package's "uses midi-ports" description literally true.

## 6. Dependency Replacement (11 runtime deps → 1)

Removed: `eventemitter3`, `camelcase`, `lodash.findkey`, `lodash.indexof`,
`lodash.initial`, `lodash.merge`, `lodash.omit`, `lodash.without`,
`lodash.zipobject`. Sole remaining runtime dep: **`midi-ports`**.

| Old | Replacement |
|---|---|
| `eventemitter3` | hand-rolled typed `EventEmitter` (`src/emitter.ts`) |
| `camelcase` | gone — midi-ports supplies normalized port keys |
| `lodash.merge` | small typed `deepMerge` for options |
| `lodash.zipobject` | `Object.fromEntries(names.map((n, i) => [n, values[i]]))` |
| `lodash.initial` | `arr.slice(0, -1)` |
| `lodash.without` | `arr.filter((x) => x != null)` |
| `lodash.findkey` | `Object.keys(o).find(...)` returning the key |
| `lodash.indexof` | `Array.prototype.indexOf` |
| `lodash.omit` | destructuring / small `omit` helper |

## 7. Cleanups Carried by the Rewrite

- Remove the module-load `document.querySelector('#kmixlog')` coupling from the
  message handler; make the debug log opt-in and environment-guarded. This is the
  change that makes the handler testable outside a browser.
- Guard `window.performance.now()` for non-browser environments (use the global
  `performance.now()` available in modern runtimes, with a fallback).
- Rename `CHANGESLOG.md` → `CHANGELOG.md`; Changesets owns it going forward.

## 8. Testing

First real test suite, using **`midi-ports/testing`** (its exported mock
`MIDIAccess`) to simulate K-Mix's three devices:

- `send()` byte output for every control type (raw, raw-control, control,
  raw-expander, expander, input/main/misc/preset) and correct output-port routing.
- Option merging: full syntax, terse array syntax, partial overrides, defaults.
- Event emission: per-control names, `:off` variant, `any` payload, channel math.
- Connection aggregation: `connected`/`disconnected` transitions and
  `isConnected(...)` for all four selectors.
- Hot-plug: input handler still fires after disconnect/reconnect.

Coverage via `@vitest/coverage-v8`, `include: ['src/**']`.

## 9. Decisions

1. **License:** keep current **ISC** (org-owned published package; licensing is
   not changed unilaterally).
2. **Release auth:** **OIDC Trusted Publisher** (matches midi-ports). Requires
   npm-side configuration on the `k-mix-api` package; can fall back to
   `NPM_TOKEN` if preferred.
3. **`test/index.html`:** dropped in favor of Vitest. A `demo/` page is out of
   scope for this effort.
4. **Version:** ship as **2.0.0** via a Changeset (major: ESM-only, new build,
   TS, midi-ports adoption).
5. **`midi-ports` as a direct dependency** (not peer), pinned to its current
   major.

## 10. Out of Scope

- New K-Mix features or control coverage beyond what 1.5.0 exposes.
- A rebuilt browser demo / playground.
- Changing the MIDI message semantics or the CC tables.
