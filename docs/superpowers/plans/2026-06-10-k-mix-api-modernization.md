# k-mix-api 2.0 Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-engineer `k-mix-api` to TypeScript with the same toolchain as `midi-ports` (pnpm/tsup/Biome/Vitest/Changesets/OIDC CI), adopt `midi-ports` for port management, drop all legacy dependencies, and add the package's first test suite — preserving full feature parity with v1.5.0.

**Architecture:** A `KMIX` class (typed `EventEmitter` subclass) wraps a `MIDIAccess` via `createMidiPorts(...)`, exposing the three K-Mix devices (Audio Control / Control Surface / Expander). Pure, independently-testable modules build MIDI messages from options + CC tables; a message handler turns inbound MIDI into named control events. ESM-only build via tsup.

**Tech Stack:** TypeScript 5 (strict, ESM), `midi-ports` (runtime dep), tsup, Biome 2, Vitest 4 + v8 coverage, Changesets, pnpm 11.5.3, GitHub Actions (Node 24).

**Reference:** The approved spec is `docs/superpowers/specs/2026-06-10-k-mix-api-modernization-design.md`. The legacy v1.5.0 JS source under `src/kmix-api.js` and `src/lib/*.js` remains in the tree as a porting reference until Task 11 deletes it. The sibling project at `~/code/midi-ports` is the canonical example for every config file.

---

## File Structure

**Tooling (Task 1):** `package.json`, `tsconfig.json`, `biome.json`, `tsup.config.ts`, `vitest.config.ts`, `pnpm-workspace.yaml`, `.gitignore`, `.changeset/config.json`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `test/setup.ts`. Delete `rollup.config.js`, `.npmignore`, `yarn.lock`; rename `CHANGESLOG.md`→`CHANGELOG.md`.

**Source (`src/`, all new TypeScript):**
- `src/emitter.ts` — typed `EventEmitter` base (replaces `eventemitter3`).
- `src/control-tables.ts` — CC lookup tables (verbatim data port).
- `src/defaults.ts` — `KMIXDefaults` + `KmixOptions`/`ControlSetting` types.
- `src/options.ts` — `convertOptions`, `arraysToObject`, `deepMerge`, `mergeOptions`.
- `src/control-messages.ts` — `getControlType`, `controlMessage`, `findControl`, `findBank`.
- `src/build-message.ts` — `controlMessageFromOptions`.
- `src/message-handler.ts` — `handleMidiMessage`, `payload`, `anyPayload`.
- `src/help.ts` — `help`.
- `src/kmix.ts` — the `KMIX` class.
- `src/index.ts` — public exports.

**Tests (`test/`, all new):** one `*.test.ts` per source module plus `test/kmix.test.ts` (integration via `createMockMidi`).

**Deleted in Task 11:** `src/kmix-api.js`, `src/lib/*.js`, `test/index.html`.

---

## Task 1: Toolchain scaffold (green baseline)

**Files:**
- Create: `package.json` (replace), `tsconfig.json`, `biome.json`, `tsup.config.ts`, `vitest.config.ts`, `pnpm-workspace.yaml`, `.gitignore` (replace), `.changeset/config.json`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `test/setup.ts`, `src/index.ts` (temporary stub), `test/smoke.test.ts` (temporary)
- Delete: `rollup.config.js`, `.npmignore`, `yarn.lock`
- Rename: `CHANGESLOG.md` → `CHANGELOG.md`

- [ ] **Step 1: Remove legacy build/packaging files**

```bash
cd ~/code/k-mix-api
git rm rollup.config.js .npmignore yarn.lock
git mv CHANGESLOG.md CHANGELOG.md
```

- [ ] **Step 2: Write `package.json`**

Replace the file entirely. Keep name/keywords/author/repository/homepage/bugs/license (ISC) from the original; version stays `1.5.0` (the changeset in Task 11 bumps it to 2.0.0 at release).

```json
{
  "name": "k-mix-api",
  "version": "1.5.0",
  "description": "Web MIDI API for full control of Keith McMillen Instruments K-Mix",
  "author": "Andrej Hronco <andrej@andrejhronco.com> (https://andrejhronco.com)",
  "license": "ISC",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": [
    "dist"
  ],
  "sideEffects": false,
  "engines": {
    "node": ">=18"
  },
  "packageManager": "pnpm@11.5.3",
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "coverage": "vitest run --coverage",
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build",
    "release": "changeset publish"
  },
  "keywords": [
    "k-mix",
    "kmix",
    "mixer",
    "audio-mixer",
    "control-surface",
    "webmidi",
    "web-midi",
    "midi"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/keithmcmilleninstruments/k-mix-api.git"
  },
  "homepage": "https://github.com/keithmcmilleninstruments/k-mix-api/#readme",
  "bugs": {
    "url": "https://github.com/keithmcmilleninstruments/k-mix-api/issues",
    "email": "andrej@andrejhronco.com"
  },
  "dependencies": {
    "midi-ports": "^3.2.0"
  },
  "devDependencies": {
    "@biomejs/biome": "2",
    "@changesets/cli": "2",
    "@vitest/coverage-v8": "4",
    "tsup": "8",
    "typescript": "5",
    "vitest": "4"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`** (copied from midi-ports, `include` scoped to `.ts`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "dist",
    "noEmit": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts", "*.config.ts"]
}
```

- [ ] **Step 4: Write `biome.json`** (`includes` scoped to `.ts` so the legacy `src/lib/*.js` is ignored until Task 11)

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.16/schema.json",
  "files": { "includes": ["src/**/*.ts", "test/**/*.ts", "*.ts"] },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "javascript": {
    "formatter": { "quoteStyle": "single", "semicolons": "asNeeded", "trailingCommas": "all" }
  },
  "assist": { "actions": { "source": { "organizeImports": "on" } } }
}
```

- [ ] **Step 5: Write `tsup.config.ts`**

```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  treeshake: true,
  clean: true,
})
```

- [ ] **Step 6: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['test/setup.ts'],
    include: ['test/**/*.test.ts'],
    coverage: { provider: 'v8', include: ['src/**'] },
  },
})
```

- [ ] **Step 7: Write `pnpm-workspace.yaml`**

```yaml
# esbuild (used by tsup/vitest) needs its install script to fetch its binary.
allowBuilds:
  esbuild: true
```

- [ ] **Step 8: Write `.gitignore`** (replace)

```
node_modules
dist
coverage
*.log
.DS_Store
```

- [ ] **Step 9: Write `.changeset/config.json`**

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- [ ] **Step 10: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v6 # version read from packageManager in package.json
      - uses: actions/setup-node@v6
        with:
          node-version: 24 # pnpm 11 requires Node >= 22.13
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run typecheck
      - run: pnpm run test
      - run: pnpm run build
```

- [ ] **Step 11: Write `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency: release-${{ github.ref }}

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write # OIDC: authenticate to npm via Trusted Publisher (no token)
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v6 # version read from packageManager in package.json
      - uses: actions/setup-node@v6
        with:
          node-version: 24 # pnpm 11 requires Node >= 22.13
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build
      - uses: changesets/action@v1
        with:
          publish: pnpm run release
          version: pnpm exec changeset version
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 12: Write `test/setup.ts`** (copied from midi-ports — makes `globalThis.navigator` writable)

```ts
/**
 * Vitest global setup: ensure `globalThis.navigator` is a configurable,
 * writable property so tests can assign fakes via `globalThis.navigator = …`.
 */
const navDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
if (navDescriptor && !navDescriptor.writable && !navDescriptor.set) {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    writable: true,
    value: navDescriptor.get ? navDescriptor.get.call(globalThis) : navDescriptor.value,
  })
}
```

- [ ] **Step 13: Write temporary `src/index.ts` stub and `test/smoke.test.ts`**

`src/index.ts` (replaced for real in Task 10):

```ts
export {}
```

`test/smoke.test.ts` (deleted in Task 10):

```ts
import { expect, test } from 'vitest'

test('toolchain is green', () => {
  expect(true).toBe(true)
})
```

- [ ] **Step 14: Install and verify the baseline is green**

Run:
```bash
cd ~/code/k-mix-api
pnpm install
pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build
```
Expected: all four succeed. `pnpm test` reports 1 passing test. `dist/index.js` is produced. If `pnpm install` prompts about build scripts for esbuild, the `pnpm-workspace.yaml` `allowBuilds` entry handles it; if it still warns, run `pnpm approve-builds` is NOT needed — the workspace file covers it.

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "chore: modernize toolchain (pnpm, tsup, biome, vitest, changesets, CI)"
```

---

## Task 2: Typed EventEmitter

**Files:**
- Create: `src/emitter.ts`
- Test: `test/emitter.test.ts`

- [ ] **Step 1: Write the failing test**

`test/emitter.test.ts`:

```ts
import { describe, expect, test, vi } from 'vitest'
import { EventEmitter } from '../src/emitter.js'

describe('EventEmitter', () => {
  test('on/emit delivers the payload to handlers', () => {
    const ee = new EventEmitter()
    const fn = vi.fn()
    ee.on('x', fn)
    expect(ee.emit('x', 42)).toBe(true)
    expect(fn).toHaveBeenCalledWith(42)
  })

  test('emit with no listeners returns false', () => {
    const ee = new EventEmitter()
    expect(ee.emit('none')).toBe(false)
  })

  test('off removes a specific handler', () => {
    const ee = new EventEmitter()
    const fn = vi.fn()
    ee.on('x', fn)
    ee.off('x', fn)
    ee.emit('x', 1)
    expect(fn).not.toHaveBeenCalled()
  })

  test('once fires exactly once', () => {
    const ee = new EventEmitter()
    const fn = vi.fn()
    ee.once('x', fn)
    ee.emit('x', 1)
    ee.emit('x', 2)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('listenerCount reflects registrations', () => {
    const ee = new EventEmitter()
    expect(ee.listenerCount('x')).toBe(0)
    ee.on('x', () => {})
    expect(ee.listenerCount('x')).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run test/emitter.test.ts`
Expected: FAIL — cannot resolve `../src/emitter.js`.

- [ ] **Step 3: Write `src/emitter.ts`**

```ts
export type EventHandler = (payload?: unknown) => void

/** Minimal typed event emitter. Replaces eventemitter3. */
export class EventEmitter {
  private readonly handlers = new Map<string, Set<EventHandler>>()

  on(event: string, handler: EventHandler): this {
    const set = this.handlers.get(event) ?? new Set<EventHandler>()
    set.add(handler)
    this.handlers.set(event, set)
    return this
  }

  once(event: string, handler: EventHandler): this {
    const wrapper: EventHandler = (payload) => {
      this.off(event, wrapper)
      handler(payload)
    }
    return this.on(event, wrapper)
  }

  off(event: string, handler?: EventHandler): this {
    if (!handler) {
      this.handlers.delete(event)
      return this
    }
    this.handlers.get(event)?.delete(handler)
    return this
  }

  emit(event: string, payload?: unknown): boolean {
    const set = this.handlers.get(event)
    if (!set || set.size === 0) return false
    for (const handler of [...set]) handler(payload)
    return true
  }

  listenerCount(event: string): number {
    return this.handlers.get(event)?.size ?? 0
  }

  listeners(event: string): EventHandler[] {
    return [...(this.handlers.get(event) ?? [])]
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run test/emitter.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Lint + commit**

```bash
pnpm run lint
git add src/emitter.ts test/emitter.test.ts
git commit -m "feat: typed EventEmitter base"
```

---

## Task 3: CC control tables and defaults

**Files:**
- Create: `src/control-tables.ts`, `src/defaults.ts`
- Test: `test/control-tables.test.ts`

- [ ] **Step 1: Write `src/control-tables.ts`** (port the three objects verbatim from the legacy `src/lib/kmix-control-messages.js`, adding `export const` + types)

```ts
export type CcTable = Record<string, number>

// INPUT CHANNEL PARAMETERS : sent to channels 1 - 9
export const input_channel_params: CcTable = {
  fader: 1,
  mute: 2,
  'eq-bypass': 3,
  'eq-high-boost': 4,
  'eq-high-frequency': 5,
  'eq-mid-boost': 6,
  'eq-mid-frequency': 7,
  'eq-mid-q': 8,
  'eq-low-boost': 9,
  'eq-low-frequency': 10,
  'gate-bypass': 11,
  'gate-threshold': 12,
  'gate-attack-time': 13,
  'gate-release-time': 14,
  'gate-gain-reduction': 15,
  'compressor-bypass': 16,
  'compressor-threshold': 17,
  'compressor-attack-time': 18,
  'compressor-release-time': 19,
  'compressor-ratio': 20,
  'compressor-makeup-gain': 21,
  'pan-main': 22,
  'send-aux-1': 23,
  'pan-aux-1': 24,
  'send-aux-2': 25,
  'pan-aux-2': 26,
  'send-aux-3': 27,
  'pan-aux-3': 28,
  trim: 29,
}

// MAIN OUTPUT BUS PARAMETERS : sent to channel 9
export const main_output_bus_params: CcTable = {
  fader: 1,
  mute: 2,
  'eq-bypass': 3,
  'eq-high-boost': 4,
  'eq-high-frequency': 5,
  'eq-mid-boost': 6,
  'eq-mid-frequency': 7,
  'eq-mid-q': 8,
  'eq-low-boost': 9,
  'eq-low-frequency': 10,
  'gate-bypass': 11,
  'gate-threshold': 12,
  'gate-attack-time': 13,
  'gate-release-time': 14,
  'gate-gain-reduction': 15,
  'compressor-bypass': 16,
  'compressor-threshold': 17,
  'compressor-attack-time': 18,
  'compressor-release-time': 19,
  'compressor-ratio': 20,
  'compressor-makeup-gain': 21,
}

// MISC. PARAMETERS (REVERB/SURROUND/AUXES) : sent to channel 10
export const misc_params: CcTable = {
  'reverb-send-1': 1,
  'reverb-send-2': 2,
  'reverb-send-3': 3,
  'reverb-send-4': 4,
  'reverb-send-5': 5,
  'reverb-send-6': 6,
  'reverb-send-7': 7,
  'reverb-send-8': 8,
  'reverb-predelay': 9,
  'reverb-decay-time': 10,
  'reverb-damping': 11,
  'reverb-diffusion': 12,
  'reverb-level': 13,
  'reverb-bypass': 14,
  'surround-panner-1-x': 15,
  'surround-panner-1-y': 16,
  'surround-panner-2-x': 17,
  'surround-panner-2-y': 18,
  'surround-panner-3-x': 19,
  'surround-panner-3-y': 20,
  'surround-panner-4-x': 21,
  'surround-panner-4-y': 22,
  'aux-1-out': 23,
  'aux-1-mute': 24,
  'aux-2-out': 25,
  'aux-2-mute': 26,
  'aux-3-out': 27,
  'aux-3-mute': 28,
}

/** Indexed [input, main, misc] — order matters; consumed by control-messages and help. */
export const messages: CcTable[] = [input_channel_params, main_output_bus_params, misc_params]
```

- [ ] **Step 2: Write `src/defaults.ts`** (port `KMIXDefaults` verbatim from the legacy `src/lib/kmix-defaults.js`, adding types)

```ts
export type ButtonMode = 'momentary' | 'toggle'

/** A single control's per-bank values plus optional message-type / button-mode metadata. */
export interface ControlSetting {
  bank_1: number
  bank_2: number
  bank_3: number
  type?: number[]
  mode?: ButtonMode
}

/** The fully-resolved options object after merging user input over the defaults. */
export interface KmixOptions {
  'midi-channels': number[]
  [control: string]: ControlSetting | number[]
}

export const KMIXDefaults: KmixOptions = {
  'midi-channels': [1, 2, 3],
  'fader-1': { bank_1: 1, bank_2: 1, bank_3: 1, type: [176] },
  'fader-2': { bank_1: 2, bank_2: 2, bank_3: 2, type: [176] },
  'fader-3': { bank_1: 3, bank_2: 3, bank_3: 3, type: [176] },
  'fader-4': { bank_1: 4, bank_2: 4, bank_3: 4, type: [176] },
  'fader-5': { bank_1: 5, bank_2: 5, bank_3: 5, type: [176] },
  'fader-6': { bank_1: 6, bank_2: 6, bank_3: 6, type: [176] },
  'fader-7': { bank_1: 7, bank_2: 7, bank_3: 7, type: [176] },
  'fader-8': { bank_1: 8, bank_2: 8, bank_3: 8, type: [176] },
  'fader-main': { bank_1: 9, bank_2: 9, bank_3: 9, type: [176] },
  'rotary-1': { bank_1: 10, bank_2: 10, bank_3: 10, type: [176] },
  'rotary-2': { bank_1: 11, bank_2: 11, bank_3: 11, type: [176] },
  'rotary-3': { bank_1: 12, bank_2: 12, bank_3: 12, type: [176] },
  'rotary-4': { bank_1: 13, bank_2: 13, bank_3: 13, type: [176] },
  'button-byps': { bank_1: 10, bank_2: 10, bank_3: 10, mode: 'momentary', type: [144, 128] },
  'button-fine': { bank_1: 11, bank_2: 11, bank_3: 11, mode: 'momentary', type: [144, 128] },
  'button-vu': { bank_1: 12, bank_2: 12, bank_3: 12, mode: 'momentary', type: [144, 128] },
  'button-main': { bank_1: 14, bank_2: 14, bank_3: 14, mode: 'momentary', type: [144, 128] },
  'button-aux-1': { bank_1: 15, bank_2: 15, bank_3: 15, mode: 'momentary', type: [144, 128] },
  'button-aux-2': { bank_1: 16, bank_2: 16, bank_3: 16, mode: 'momentary', type: [144, 128] },
  'button-aux-3': { bank_1: 17, bank_2: 17, bank_3: 17, mode: 'momentary', type: [144, 128] },
  'button-comp': { bank_1: 18, bank_2: 18, bank_3: 18, mode: 'momentary', type: [144, 128] },
  'button-gate': { bank_1: 19, bank_2: 19, bank_3: 19, mode: 'momentary', type: [144, 128] },
  'button-pan': { bank_1: 20, bank_2: 20, bank_3: 20, mode: 'momentary', type: [144, 128] },
  'button-eq': { bank_1: 21, bank_2: 21, bank_3: 21, mode: 'momentary', type: [144, 128] },
  'button-verb': { bank_1: 22, bank_2: 22, bank_3: 22, mode: 'momentary', type: [144, 128] },
  'button-trim': { bank_1: 23, bank_2: 23, bank_3: 23, mode: 'momentary', type: [144, 128] },
  'button-48v': { bank_1: 24, bank_2: 24, bank_3: 24, mode: 'momentary', type: [144, 128] },
  'button-headphones': { bank_1: 25, bank_2: 25, bank_3: 25, mode: 'momentary', type: [144, 128] },
  'button-preset': { bank_1: 13, bank_2: 13, bank_3: 13, mode: 'momentary', type: [144, 128] },
  'channel-select-1': { bank_1: 1, bank_2: 1, bank_3: 1, mode: 'momentary', type: [144, 128] },
  'channel-select-2': { bank_1: 2, bank_2: 2, bank_3: 2, mode: 'momentary', type: [144, 128] },
  'channel-select-3': { bank_1: 3, bank_2: 3, bank_3: 3, mode: 'momentary', type: [144, 128] },
  'channel-select-4': { bank_1: 4, bank_2: 4, bank_3: 4, mode: 'momentary', type: [144, 128] },
  'channel-select-5': { bank_1: 5, bank_2: 5, bank_3: 5, mode: 'momentary', type: [144, 128] },
  'channel-select-6': { bank_1: 6, bank_2: 6, bank_3: 6, mode: 'momentary', type: [144, 128] },
  'channel-select-7': { bank_1: 7, bank_2: 7, bank_3: 7, mode: 'momentary', type: [144, 128] },
  'channel-select-8': { bank_1: 8, bank_2: 8, bank_3: 8, mode: 'momentary', type: [144, 128] },
  'channel-select-main': { bank_1: 9, bank_2: 9, bank_3: 9, mode: 'momentary', type: [144, 128] },
  'transport-up': { bank_1: 26, bank_2: 26, bank_3: 26, mode: 'momentary', type: [144, 128] },
  'transport-down': { bank_1: 27, bank_2: 27, bank_3: 27, mode: 'momentary', type: [144, 128] },
  'transport-left': { bank_1: 28, bank_2: 28, bank_3: 28, mode: 'momentary', type: [144, 128] },
  'transport-right': { bank_1: 29, bank_2: 29, bank_3: 29, mode: 'momentary', type: [144, 128] },
}
```

- [ ] **Step 3: Write the sanity test**

`test/control-tables.test.ts`:

```ts
import { expect, test } from 'vitest'
import { input_channel_params, messages, misc_params } from '../src/control-tables.js'
import { KMIXDefaults } from '../src/defaults.js'

test('CC tables expose known values', () => {
  expect(input_channel_params.fader).toBe(1)
  expect(input_channel_params.trim).toBe(29)
  expect(misc_params['aux-3-mute']).toBe(28)
  expect(messages).toHaveLength(3)
})

test('defaults expose midi-channels and a button mode', () => {
  expect(KMIXDefaults['midi-channels']).toEqual([1, 2, 3])
  expect((KMIXDefaults['button-vu'] as { mode: string }).mode).toBe('momentary')
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run test/control-tables.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Lint + commit**

```bash
pnpm run lint
git add src/control-tables.ts src/defaults.ts test/control-tables.test.ts
git commit -m "feat: port CC tables and defaults to typed modules"
```

---

## Task 4: Options conversion and merge

**Files:**
- Create: `src/options.ts`
- Test: `test/options.test.ts`

- [ ] **Step 1: Write the failing test**

`test/options.test.ts`:

```ts
import { expect, test } from 'vitest'
import { arraysToObject, convertOptions, deepMerge, mergeOptions } from '../src/options.js'

test('arraysToObject maps positional values to bank keys (+ optional mode)', () => {
  expect(arraysToObject([1, 1, 1])).toEqual({ bank_1: 1, bank_2: 1, bank_3: 1 })
  expect(arraysToObject([13, 13, 13, 'toggle'])).toEqual({
    bank_1: 13,
    bank_2: 13,
    bank_3: 13,
    mode: 'toggle',
  })
})

test('convertOptions leaves midi-channels and object values untouched', () => {
  const out = convertOptions({
    'midi-channels': [1, 2, 3],
    'fader-1': [4, 4, 4],
    'button-vu': { bank_1: 1, bank_2: 1, bank_3: 1 },
  })
  expect(out['midi-channels']).toEqual([1, 2, 3])
  expect(out['fader-1']).toEqual({ bank_1: 4, bank_2: 4, bank_3: 4 })
  expect(out['button-vu']).toEqual({ bank_1: 1, bank_2: 1, bank_3: 1 })
})

test('deepMerge merges nested objects and skips undefined', () => {
  const merged = deepMerge(
    { a: { x: 1, y: 2 }, b: 3 },
    { a: { y: 9 }, b: undefined },
  )
  expect(merged).toEqual({ a: { x: 1, y: 9 }, b: 3 })
})

test('mergeOptions overlays user options over defaults without mutating defaults', () => {
  const result = mergeOptions({ 'fader-1': [7, 7, 7] })
  expect((result['fader-1'] as { bank_1: number }).bank_1).toBe(7)
  // untouched default survives
  expect((result['fader-2'] as { bank_1: number }).bank_1).toBe(2)
  // a second call sees pristine defaults (no mutation leak)
  const again = mergeOptions({})
  expect((again['fader-1'] as { bank_1: number }).bank_1).toBe(1)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run test/options.test.ts`
Expected: FAIL — cannot resolve `../src/options.js`.

- [ ] **Step 3: Write `src/options.ts`**

```ts
import { KMIXDefaults, type KmixOptions } from './defaults.js'

const BANK_NAMES = ['bank_1', 'bank_2', 'bank_3', 'mode'] as const

export type UserControlValue =
  | Partial<{ bank_1: number; bank_2: number; bank_3: number; mode: string; type: number[] }>
  | Array<number | string>

export interface UserOptions {
  'midi-channels'?: number[]
  [control: string]: UserControlValue | number[] | undefined
}

/** Map a positional `[v1, v2, v3, mode?]` array to `{ bank_1, bank_2, bank_3, mode? }`. */
export function arraysToObject(values: Array<number | string>): Record<string, number | string> {
  const out: Record<string, number | string> = {}
  BANK_NAMES.forEach((name, i) => {
    const v = values[i]
    if (v !== undefined) out[name] = v
  })
  return out
}

/** Convert terse array-form control values to object form. midi-channels and object values pass through. */
export function convertOptions(user: UserOptions): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(user)) {
    const value = user[key]
    if (key === 'midi-channels' || !Array.isArray(value)) {
      out[key] = value
    } else {
      out[key] = arraysToObject(value as Array<number | string>)
    }
  }
  return out
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Deep-merge `source` over a clone of `target`. Arrays are replaced wholesale; `undefined` is skipped. */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>,
): T {
  const out: Record<string, unknown> = { ...target }
  for (const key of Object.keys(source)) {
    const sv = source[key]
    if (sv === undefined) continue
    const tv = out[key]
    out[key] = isPlainObject(sv) && isPlainObject(tv) ? deepMerge(tv, sv) : sv
  }
  return out as T
}

/** Convert + merge user options over the pristine defaults. Never mutates KMIXDefaults. */
export function mergeOptions(user: UserOptions = {}): KmixOptions {
  const converted = convertOptions(user)
  return deepMerge(
    KMIXDefaults as unknown as Record<string, unknown>,
    converted,
  ) as unknown as KmixOptions
}
```

> **Note (intentional fix):** the legacy code merged with `lodash.merge(kmixDefaults, …)`, which mutated the shared `KMIXDefaults` module object across instances. `mergeOptions` clones instead, so multiple `KMIX` instances no longer contaminate each other. This is the behavior the last test step pins.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run test/options.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Lint + commit**

```bash
pnpm run lint
git add src/options.ts test/options.test.ts
git commit -m "feat: typed options conversion and non-mutating merge"
```

---

## Task 5: Control message builders

**Files:**
- Create: `src/control-messages.ts`
- Test: `test/control-messages.test.ts`

- [ ] **Step 1: Write the failing test**

`test/control-messages.test.ts`:

```ts
import { expect, test } from 'vitest'
import {
  controlMessage,
  findBank,
  findControl,
  getControlType,
} from '../src/control-messages.js'
import { KMIXDefaults } from '../src/defaults.js'

test('getControlType classifies every routing', () => {
  expect(getControlType([176, 1, 127])).toBe('raw')
  expect(getControlType('control')).toBe('raw-control')
  expect(getControlType('control:button-vu')).toBe('control')
  expect(getControlType('expander')).toBe('raw-expander')
  expect(getControlType('expander:x')).toBe('expander')
  expect(getControlType('fader:1')).toBe('input')
  expect(getControlType('main:fader')).toBe('main')
  expect(getControlType('misc:reverb-level')).toBe('misc')
  expect(getControlType('preset')).toBe('preset')
})

test('controlMessage builds input-channel CC messages', () => {
  // fader on input channel 1: type 176 + (1-1) = 176, cc 1
  expect(controlMessage('fader:1', 100, 'input')).toEqual([176, 1, 100])
  // mute on input channel 3: 176 + 2 = 178, cc 2
  expect(controlMessage('mute:3', 64, 'input')).toEqual([178, 2, 64])
})

test('controlMessage builds main/misc messages on their fixed channels', () => {
  // main bus is channel 9: 176 + 8 = 184
  expect(controlMessage('main:fader', 100, 'main')).toEqual([184, 1, 100])
  // misc is channel 10: 176 + 9 = 185
  expect(controlMessage('misc:reverb-level', 50, 'misc')).toEqual([185, 13, 50])
})

test('controlMessage builds a 2-byte program-change for preset', () => {
  // preset uses channel 1 by default: 192 + 0 = 192, then null cc is dropped
  expect(controlMessage('preset', 5, 'preset')).toEqual([192, 5])
})

test('findBank maps a MIDI channel to a bank name', () => {
  // midi-channels [1,2,3]; incoming channel index 0 -> channel 1 -> bank_1
  expect(findBank(['bank_1', 'bank_2', 'bank_3'], 0, KMIXDefaults)).toBe('bank_1')
  expect(findBank(['bank_1', 'bank_2', 'bank_3'], 2, KMIXDefaults)).toBe('bank_3')
})

test('findControl resolves a control name from value/type/bank', () => {
  // button-vu: bank_1 = 12, note-on type 144
  expect(findControl(12, 144, 'bank_1', KMIXDefaults)).toBe('button-vu')
  // fader-1: bank_1 = 1, CC type 176
  expect(findControl(1, 176, 'bank_1', KMIXDefaults)).toBe('fader-1')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run test/control-messages.test.ts`
Expected: FAIL — cannot resolve `../src/control-messages.js`.

- [ ] **Step 3: Write `src/control-messages.ts`**

```ts
import { messages } from './control-tables.js'
import type { ControlSetting, KmixOptions } from './defaults.js'

/** Classify a control argument into its routing/message type. */
export function getControlType(control: string | number[]): string {
  if (Array.isArray(control)) return 'raw'
  const split = control.split(':')
  if (control === 'control') return 'raw-control'
  if (split[0] === 'control') return 'control'
  if (control === 'expander') return 'raw-expander'
  if (split[0] === 'expander') return 'expander'
  if (split[1] !== undefined && !Number.isNaN(Number(split[1]))) return 'input'
  return split[0] ?? ''
}

const MESSAGE_TYPES = ['input', 'main', 'misc', 'preset']
const CHANNEL_TYPES = [1, 9, 10, 1]

/** Build a MIDI message for an audio-control parameter from the CC tables. */
export function controlMessage(control: string, value: number, messageType = 'input'): number[] {
  const split = control.split(':')
  let controlName: string
  let inputChannel = 0
  let type: number
  let cc: number | null

  if (messageType === 'input') {
    controlName = split[0] ?? ''
    inputChannel = Number(split[1])
  } else {
    controlName = split[1] ?? ''
  }

  if (control === 'preset') {
    type = 192
    cc = null
    messageType = 'preset'
  } else {
    type = 176
    const idx = MESSAGE_TYPES.indexOf(messageType)
    const table = messages[idx]
    cc = table ? (table[controlName] ?? null) : null
  }

  const channel =
    messageType === 'input' ? inputChannel : (CHANNEL_TYPES[MESSAGE_TYPES.indexOf(messageType)] ?? 1)

  type = type + channel - 1
  return [type, cc, value].filter((x): x is number => x != null)
}

/** Find the control name whose `type` includes `eventType` and whose `bank` value equals `value`. */
export function findControl(
  value: number,
  eventType: number,
  bank: string,
  options: KmixOptions,
): string | undefined {
  return Object.keys(options).find((key) => {
    const setting = options[key]
    if (!setting || Array.isArray(setting)) return false
    const { type } = setting as ControlSetting
    const bankValue = (setting as unknown as Record<string, unknown>)[bank]
    return Array.isArray(type) && type.indexOf(eventType) !== -1 && bankValue === value
  })
}

/** Resolve which bank a given incoming MIDI channel belongs to. */
export function findBank(
  banks: string[],
  channel: number,
  options: KmixOptions,
): string | undefined {
  return banks[options['midi-channels'].indexOf(channel + 1)]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run test/control-messages.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Lint + commit**

```bash
pnpm run lint
git add src/control-messages.ts test/control-messages.test.ts
git commit -m "feat: typed control-message builders"
```

---

## Task 6: Options-based message builder

**Files:**
- Create: `src/build-message.ts`
- Test: `test/build-message.test.ts`

- [ ] **Step 1: Write the failing test**

`test/build-message.test.ts`:

```ts
import { expect, test } from 'vitest'
import { controlMessageFromOptions } from '../src/build-message.js'
import { mergeOptions } from '../src/options.js'

const options = mergeOptions({})

test('fader/rotary controls produce CC (176) messages on the bank channel', () => {
  // bank 1 -> midi-channel 1 -> 176 + 0 = 176; fader-1 cc 1
  expect(controlMessageFromOptions('fader-1', 100, 1, options)).toEqual([176, 1, 100])
  // bank 2 -> midi-channel 2 -> 176 + 1 = 177; rotary-1 cc 10
  expect(controlMessageFromOptions('rotary-1', 64, 2, options)).toEqual([177, 10, 64])
})

test('button press (value != 0) sends note-on 144 with value forced to 127', () => {
  // button-vu cc 12, bank 1 channel 1 -> 144 + 0 = 144
  expect(controlMessageFromOptions('button-vu', 1, 1, options)).toEqual([144, 12, 127])
})

test('button release (value === 0) sends note-off 128', () => {
  expect(controlMessageFromOptions('button-vu', 0, 1, options)).toEqual([128, 12, 0])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run test/build-message.test.ts`
Expected: FAIL — cannot resolve `../src/build-message.js`.

- [ ] **Step 3: Write `src/build-message.ts`**

```ts
import type { ControlSetting, KmixOptions } from './defaults.js'

const BANKS = ['bank_1', 'bank_2', 'bank_3']

/** Build a MIDI message for a control-surface control from the merged options + bank. */
export function controlMessageFromOptions(
  control: string,
  value: number,
  bank: number,
  options: KmixOptions,
): number[] {
  const channel = options['midi-channels'][bank - 1]
  const bankKey = BANKS[bank - 1]
  const setting = options[control] as ControlSetting | undefined
  const cc =
    setting && bankKey
      ? (setting as unknown as Record<string, number>)[bankKey]
      : undefined

  let type: number
  let outValue = value
  if (control.includes('fader') || control.includes('rotary')) {
    type = 176
  } else if (value === 0) {
    type = 128
  } else {
    type = 144
    outValue = 127
  }

  if (channel === undefined) throw new Error('Check control name')
  type = type + channel - 1

  return [type, cc, outValue].filter((x): x is number => x != null)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run test/build-message.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Lint + commit**

```bash
pnpm run lint
git add src/build-message.ts test/build-message.test.ts
git commit -m "feat: typed options-based message builder"
```

---

## Task 7: Inbound MIDI message handler

**Files:**
- Create: `src/message-handler.ts`
- Test: `test/message-handler.test.ts`

- [ ] **Step 1: Write the failing test**

`test/message-handler.test.ts`:

```ts
import { describe, expect, test, vi } from 'vitest'
import { EventEmitter } from '../src/emitter.js'
import { anyPayload, handleMidiMessage, payload } from '../src/message-handler.js'
import { mergeOptions } from '../src/options.js'

const banks = ['bank_1', 'bank_2', 'bank_3']

function ctx(emitter: EventEmitter) {
  return { banks, options: mergeOptions({}), emitter, debug: false as const }
}

function midiEvent(data: number[], name = 'K-Mix Control Surface'): MIDIMessageEvent {
  return {
    data: Uint8Array.from(data),
    target: { name, id: 'cs-in' },
  } as unknown as MIDIMessageEvent
}

describe('payload helpers', () => {
  test('payload extracts channel/value/raw', () => {
    expect(payload([176, 1, 100])).toEqual({ channel: 1, value: 100, raw: [176, 1, 100] })
  })
  test('anyPayload includes the control name', () => {
    expect(anyPayload('fader-1', [176, 1, 100])).toEqual({
      control: 'fader-1',
      channel: 1,
      value: 100,
      raw: [176, 1, 100],
    })
  })
})

describe('handleMidiMessage', () => {
  test('emits the resolved control name with payload', () => {
    const ee = new EventEmitter()
    const fn = vi.fn()
    ee.on('fader-1', fn)
    // CC 176 (type), control 1, value 100, on midi channel 0 -> bank_1
    handleMidiMessage(midiEvent([176, 1, 100]), ctx(ee))
    expect(fn).toHaveBeenCalledWith({ channel: 1, value: 100, raw: [176, 1, 100] })
  })

  test('emits a :off variant for note-off (128)', () => {
    const ee = new EventEmitter()
    const fn = vi.fn()
    ee.on('button-vu:off', fn)
    // note-off 128 on channel 0, control 12 (button-vu bank_1)
    handleMidiMessage(midiEvent([128, 12, 0]), ctx(ee))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('emits an any event carrying the control name', () => {
    const ee = new EventEmitter()
    const fn = vi.fn()
    ee.on('any', fn)
    handleMidiMessage(midiEvent([176, 1, 100]), ctx(ee))
    expect(fn).toHaveBeenCalledWith({
      control: 'fader-1',
      channel: 1,
      value: 100,
      raw: [176, 1, 100],
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run test/message-handler.test.ts`
Expected: FAIL — cannot resolve `../src/message-handler.js`.

- [ ] **Step 3: Write `src/message-handler.ts`**

```ts
import { findBank, findControl } from './control-messages.js'
import type { KmixOptions } from './defaults.js'
import type { EventEmitter } from './emitter.js'

export interface MidiPayload {
  channel: number
  value: number
  raw: number[]
}

export interface AnyPayload extends MidiPayload {
  control: string
}

export function payload(data: number[]): MidiPayload {
  return { channel: ((data[0] ?? 0) & 0xf) + 1, value: data[2] ?? 0, raw: data }
}

export function anyPayload(control: string, data: number[]): AnyPayload {
  return { control, channel: ((data[0] ?? 0) & 0xf) + 1, value: data[2] ?? 0, raw: data }
}

export interface MessageHandlerContext {
  banks: string[]
  options: KmixOptions
  emitter: EventEmitter
  debug: boolean | 'state'
}

/** Translate an inbound MIDI message into named control events. */
export function handleMidiMessage(event: MIDIMessageEvent, ctx: MessageHandlerContext): void {
  const data = event.data ? Array.from(event.data) : []
  const status = data[0] ?? 0
  const type = status & 0xf0
  const channel = status & 0xf
  const control = data[1] ?? 0
  const target = event.target as (MIDIInput & { name?: string; id?: string }) | null
  const port = target?.name ?? ''

  const bank = findBank(ctx.banks, channel, ctx.options)
  const controlName = bank ? findControl(control, type, bank, ctx.options) : undefined
  const kind = type === 128 ? ':off' : ''
  const name = (controlName ?? '') + kind

  ctx.emitter.emit(name, payload(data))
  if (ctx.emitter.listenerCount('any') > 0) {
    ctx.emitter.emit('any', anyPayload(name, data))
  }

  if (ctx.debug === true) {
    const log: Record<string, unknown> = {
      control: controlName,
      port,
      portID: target?.id,
      data,
      channel: channel + 1,
    }
    if (port === 'K-Mix Audio Control') {
      delete log.control
      log.channel = (data[7] ?? 0) + 1
    }
    console.log('Event Debug', log)
  }
}
```

> **Note (intentional cleanup):** the legacy handler read `document.querySelector('#kmixlog')` at module load and wrote to it on every message. That DOM coupling is removed — debug output now goes only to `console.log` when `debug === true`, which makes the handler runnable (and testable) outside a browser. Unmatched controls emit `'' (+ ':off')` rather than the literal string `'undefined'` the old code produced.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run test/message-handler.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Lint + commit**

```bash
pnpm run lint
git add src/message-handler.ts test/message-handler.test.ts
git commit -m "feat: typed inbound MIDI message handler (DOM coupling removed)"
```

---

## Task 8: Help

**Files:**
- Create: `src/help.ts`
- Test: `test/help.test.ts`

- [ ] **Step 1: Write the failing test**

`test/help.test.ts`:

```ts
import { afterEach, expect, test, vi } from 'vitest'
import { help } from '../src/help.js'
import { mergeOptions } from '../src/options.js'

afterEach(() => vi.restoreAllMocks())

test('help("input") prints the input CC table', () => {
  const table = vi.spyOn(console, 'table').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  help(mergeOptions({}), 'input')
  expect(table).toHaveBeenCalledTimes(1)
})

test('help("control") omits midi-channels from the printed options', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'table').mockImplementation(() => {})
  help(mergeOptions({}), 'control')
  const printed = log.mock.calls.at(-1)?.[1] as Record<string, unknown>
  expect(printed).not.toHaveProperty('midi-channels')
  expect(printed).toHaveProperty('fader-1')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run test/help.test.ts`
Expected: FAIL — cannot resolve `../src/help.js`.

- [ ] **Step 3: Write `src/help.ts`**

```ts
import { messages } from './control-tables.js'
import type { KmixOptions } from './defaults.js'

function helpObject(obj: Record<string, number>, label = 'control') {
  return Object.keys(obj).map((key) => ({ [label]: key, CC: obj[key] }))
}

/** Print K-Mix CC reference tables (input/main/misc) or the configured control map. */
export function help(options: KmixOptions, request: string): void {
  switch (request) {
    case 'input':
      console.log('\nhelp:input')
      console.table(helpObject(messages[0] ?? {}, 'control: per-channel 1 - 8'))
      break
    case 'main':
      console.log('\nhelp:main')
      console.table(helpObject(messages[1] ?? {}, 'control: channel 9 (auto)'))
      break
    case 'misc':
      console.log('\nhelp:misc')
      console.table(helpObject(messages[2] ?? {}, 'control: channel 10 (auto)'))
      break
    case 'control': {
      const { 'midi-channels': _channels, ...rest } = options
      console.log(
        '\nhelp:control. What channels are assigned to each control/bank, Editor MIDI tab',
        rest,
      )
      console.table(rest)
      break
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run test/help.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Lint + commit**

```bash
pnpm run lint
git add src/help.ts test/help.test.ts
git commit -m "feat: typed help() reference printer"
```

---

## Task 9: KMIX class (wires midi-ports)

**Files:**
- Create: `src/kmix.ts`
- Test: `test/kmix.test.ts`

- [ ] **Step 1: Write the failing test**

`test/kmix.test.ts`:

```ts
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createMockMidi, type MockMidi } from 'midi-ports/testing'
import { KMIX } from '../src/kmix.js'

const PORTS = [
  { id: 'ac-in', name: 'K-Mix Audio Control', type: 'input' as const },
  { id: 'ac-out', name: 'K-Mix Audio Control', type: 'output' as const },
  { id: 'cs-in', name: 'K-Mix Control Surface', type: 'input' as const },
  { id: 'cs-out', name: 'K-Mix Control Surface', type: 'output' as const },
  { id: 'ex-in', name: 'K-Mix Expander', type: 'input' as const },
  { id: 'ex-out', name: 'K-Mix Expander', type: 'output' as const },
]

function fullRig(): MockMidi {
  return createMockMidi(PORTS)
}

describe('KMIX construction', () => {
  test('merges options and exposes banks', () => {
    const mock = fullRig()
    const kmix = new KMIX(mock.access)
    expect(kmix.banks).toEqual(['bank_1', 'bank_2', 'bank_3'])
    expect((kmix.options['fader-1'] as { bank_1: number }).bank_1).toBe(1)
  })

  test('logs an error when the control surface input is absent', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const mock = createMockMidi([{ id: 'ac-out', name: 'K-Mix Audio Control', type: 'output' }])
    new KMIX(mock.access)
    expect(err).toHaveBeenCalled()
    err.mockRestore()
  })
})

describe('isConnected', () => {
  test('reports all + per-device connection state', () => {
    const kmix = new KMIX(fullRig().access)
    expect(kmix.isConnected('all')).toBe(true)
    expect(kmix.isConnected('audio-control')).toBe(true)
    expect(kmix.isConnected('control-surface')).toBe(true)
    expect(kmix.isConnected('expander')).toBe(true)
  })

  test('all is false when a device is missing its output', () => {
    const mock = createMockMidi(PORTS.filter((p) => p.id !== 'ex-out'))
    const kmix = new KMIX(mock.access)
    expect(kmix.isConnected('expander')).toBe(false)
    expect(kmix.isConnected('all')).toBe(false)
  })
})

describe('send routing', () => {
  test('raw array goes to the Audio Control output', () => {
    const mock = fullRig()
    new KMIX(mock.access).send([176, 1, 127])
    expect(mock.sent).toContainEqual({ id: 'ac-out', data: [176, 1, 127] })
  })

  test('raw-control goes to the Control Surface output', () => {
    const mock = fullRig()
    new KMIX(mock.access).send('control', [176, 1, 127])
    expect(mock.sent).toContainEqual({ id: 'cs-out', data: [176, 1, 127] })
  })

  test('control:<name> builds from options and routes to Control Surface', () => {
    const mock = fullRig()
    // button-vu cc 12, bank 1 channel 1, press -> 144,12,127
    new KMIX(mock.access).send('control:button-vu', 1)
    expect(mock.sent).toContainEqual({ id: 'cs-out', data: [144, 12, 127] })
  })

  test('expander routes to the Expander output', () => {
    const mock = fullRig()
    new KMIX(mock.access).send('expander:x', [176, 5, 64])
    expect(mock.sent).toContainEqual({ id: 'ex-out', data: [176, 5, 64] })
  })

  test('input-channel control routes to Audio Control output', () => {
    const mock = fullRig()
    // fader on input channel 1 -> 176,1,100
    new KMIX(mock.access).send('fader:1', 100)
    expect(mock.sent).toContainEqual({ id: 'ac-out', data: [176, 1, 100] })
  })

  test('warns and sends nothing for an unknown short control', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mock = fullRig()
    new KMIX(mock.access).send('main:does-not-exist', 1)
    expect(warn).toHaveBeenCalled()
    expect(mock.sent).toHaveLength(0)
    warn.mockRestore()
  })
})

describe('inbound events', () => {
  test('an inbound CC fires the named control event', () => {
    const mock = fullRig()
    const kmix = new KMIX(mock.access)
    const fn = vi.fn()
    kmix.on('fader-1', fn)
    const input = mock.access.inputs.get('cs-in') as MIDIInput
    input.onmidimessage?.(
      { data: Uint8Array.from([176, 1, 100]), target: input } as unknown as MIDIMessageEvent,
    )
    expect(fn).toHaveBeenCalledWith({ channel: 1, value: 100, raw: [176, 1, 100] })
  })
})

describe('connection events', () => {
  test('emits connected when the last missing port appears', () => {
    const mock = createMockMidi(PORTS.filter((p) => p.id !== 'ex-out'))
    const kmix = new KMIX(mock.access)
    const fn = vi.fn()
    kmix.on('connected', fn)
    mock.connect({ id: 'ex-out', name: 'K-Mix Expander', type: 'output' })
    expect(fn).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run test/kmix.test.ts`
Expected: FAIL — cannot resolve `../src/kmix.js`.

- [ ] **Step 3: Write `src/kmix.ts`**

```ts
import { createMidiPorts, type MidiPorts, type Port } from 'midi-ports'
import { controlMessageFromOptions } from './build-message.js'
import { controlMessage, getControlType } from './control-messages.js'
import type { KmixOptions } from './defaults.js'
import { EventEmitter } from './emitter.js'
import { help as helpRequest } from './help.js'
import { handleMidiMessage } from './message-handler.js'
import { mergeOptions, type UserOptions } from './options.js'

export type KmixDebug = boolean | 'state'
export type ConnectionQuery = 'all' | 'audio-control' | 'control-surface' | 'expander'

const DEVICES = {
  'audio-control': { ports: ['k-mix-audio-control'] },
  'control-surface': { ports: ['k-mix-control-surface'] },
  expander: { ports: ['k-mix-expander'] },
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : 0
}

export class KMIX extends EventEmitter {
  readonly deviceName = 'K-Mix'
  readonly options: KmixOptions
  readonly banks = ['bank_1', 'bank_2', 'bank_3']
  private readonly ports: MidiPorts
  private readonly debug: KmixDebug

  constructor(midi: MIDIAccess, userOptions: UserOptions = {}, debug: KmixDebug = false) {
    super()
    this.debug = debug
    this.options = mergeOptions(userOptions)
    this.ports = createMidiPorts(midi, { devices: DEVICES })

    this.ports.on('connect', () => this.onConnectionChange())
    this.ports.on('disconnect', () => this.onConnectionChange())

    this.attachInput()

    if (!this.controlSurface?.input) {
      console.error('> K-Mix API: Control Surface Port not connected')
    }
  }

  get audioControl(): Port | undefined {
    return this.ports.get('k-mix-audio-control')
  }
  get controlSurface(): Port | undefined {
    return this.ports.get('k-mix-control-surface')
  }
  get expander(): Port | undefined {
    return this.ports.get('k-mix-expander')
  }

  private attachInput(): void {
    const input = this.controlSurface?.input
    if (!input) return
    input.onmidimessage = (event) =>
      handleMidiMessage(event, {
        banks: this.banks,
        options: this.options,
        emitter: this,
        debug: this.debug,
      })
  }

  private bothConnected(port?: Port): boolean {
    return !!(port?.input && port?.output)
  }

  private onConnectionChange(): void {
    // Re-attach the inbound listener so input keeps working after a reconnect.
    this.attachInput()
    const all = [this.audioControl, this.controlSurface, this.expander]
    if (all.every((p) => this.bothConnected(p))) this.emit('connected')
    if (all.every((p) => !(p?.input || p?.output))) this.emit('disconnected')
  }

  send(control: string | number[], value?: number | number[], bank = 1, time = 0): void {
    const controlType = getControlType(control)
    let sendTime = Number(time) || 0
    let message: number[] | undefined
    let output: MIDIOutput | undefined

    switch (controlType) {
      case 'raw':
        message = control as number[]
        output = this.audioControl?.output
        // raw form is send([...], time): the time rides in the value slot.
        sendTime = typeof value === 'number' ? value : 0
        break
      case 'raw-control':
        message = value as number[]
        output = this.controlSurface?.output
        break
      case 'control': {
        const name = (control as string).split(':')[1] ?? ''
        message = controlMessageFromOptions(name, value as number, bank, this.options)
        output = this.controlSurface?.output
        break
      }
      case 'raw-expander':
      case 'expander':
        message = value as number[]
        output = this.expander?.output
        break
      default:
        message = controlMessage(control as string, value as number, controlType)
        output = this.audioControl?.output
        break
    }

    if (!message || (message.length < 3 && controlType !== 'preset')) {
      console.warn('>> K-Mix: Please check control name')
      return
    }
    output?.send(message, now() + sendTime)
  }

  isConnected(port: ConnectionQuery | string = 'all'): boolean {
    switch (port) {
      case 'all':
        return [this.audioControl, this.controlSurface, this.expander].every((p) =>
          this.bothConnected(p),
        )
      case 'audio-control':
        return this.bothConnected(this.audioControl)
      case 'control-surface':
        return this.bothConnected(this.controlSurface)
      case 'expander':
        return this.bothConnected(this.expander)
      default:
        return false
    }
  }

  help(request: string): void {
    helpRequest(this.options, request)
  }
}
```

> **Note (intentional fixes vs v1.5.0):** (a) the raw timestamp is now honored — the legacy code computed `sendTime` before re-reading the raw `time`, so timed raw sends were silently dropped; (b) the control-surface input listener is re-attached on hot-plug via `onConnectionChange`, where the legacy code attached once in the constructor and broke after a reconnect. Both are documented in the changeset (Task 11).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run test/kmix.test.ts`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Lint + commit**

```bash
pnpm run lint
git add src/kmix.ts test/kmix.test.ts
git commit -m "feat: KMIX class on top of midi-ports"
```

---

## Task 10: Public exports

**Files:**
- Modify: `src/index.ts` (replace the Task 1 stub)
- Delete: `test/smoke.test.ts`
- Test: `test/index.test.ts`

- [ ] **Step 1: Write the failing test**

`test/index.test.ts`:

```ts
import { expect, test } from 'vitest'
import { createMockMidi } from 'midi-ports/testing'
import KMIX, { KMIX as NamedKMIX } from '../src/index.js'

test('default and named exports are the KMIX class', () => {
  expect(KMIX).toBe(NamedKMIX)
})

test('default export constructs and sends', () => {
  const mock = createMockMidi([
    { id: 'ac-out', name: 'K-Mix Audio Control', type: 'output' },
    { id: 'cs-in', name: 'K-Mix Control Surface', type: 'input' },
    { id: 'cs-out', name: 'K-Mix Control Surface', type: 'output' },
  ])
  const kmix = new KMIX(mock.access)
  kmix.send('fader:1', 100)
  expect(mock.sent).toContainEqual({ id: 'ac-out', data: [176, 1, 100] })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run test/index.test.ts`
Expected: FAIL — `src/index.ts` is the `export {}` stub; no default export.

- [ ] **Step 3: Replace `src/index.ts` and delete the smoke test**

`src/index.ts`:

```ts
export { KMIX, KMIX as default } from './kmix.js'
export type { ConnectionQuery, KmixDebug } from './kmix.js'
export type { ButtonMode, ControlSetting, KmixOptions } from './defaults.js'
export type { UserControlValue, UserOptions } from './options.js'
export type { AnyPayload, MidiPayload } from './message-handler.js'
export { EventEmitter } from './emitter.js'
export type { CcTable } from './control-tables.js'
```

```bash
git rm test/smoke.test.ts
```

- [ ] **Step 4: Run the full suite + build to verify everything is green**

Run:
```bash
pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build
```
Expected: lint clean, typecheck clean, all tests pass, `dist/index.js` + `dist/index.d.ts` produced.

- [ ] **Step 5: Commit**

```bash
git add src/index.ts test/index.test.ts
git commit -m "feat: public exports + default KMIX export"
```

---

## Task 11: Remove legacy source, update README, add changeset

**Files:**
- Delete: `src/kmix-api.js`, `src/lib/` (all), `test/index.html`
- Modify: `README.md`
- Create: `.changeset/k-mix-api-2-0.md`

- [ ] **Step 1: Delete the legacy JavaScript source and manual harness**

```bash
cd ~/code/k-mix-api
git rm src/kmix-api.js src/lib/control-message.js src/lib/control-message-from-options.js \
  src/lib/help.js src/lib/kmix-control-messages.js src/lib/kmix-defaults.js \
  src/lib/midiMessageHandler.js src/lib/stateChangeHandler.js src/lib/utilities.js \
  test/index.html
```

- [ ] **Step 2: Verify the suite still passes with the legacy files gone**

Run:
```bash
pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build
```
Expected: all green (nothing imported the deleted files).

- [ ] **Step 3: Update the README install/usage sections**

In `README.md`, replace the `##Install` and `##Usage` sections (note the original headings have no space after `##`) with the modern ESM-first guidance. Make these edits:

Replace:
```
##Install
```bash
npm install k-mix-api
```
```
with:
```
## Install

```bash
npm install k-mix-api
```

`k-mix-api` is ESM-only and ships TypeScript types. It depends on
[`midi-ports`](https://github.com/andrejhronco/midi-ports) for cross-platform
port resolution and hot-plug handling.
```

Replace the `##Usage` block's heading `##Usage` with `## Usage` and keep the existing example (it remains valid — `new KMIX(midi)` is unchanged). Immediately after the existing usage example, add:

```
### TypeScript

```ts
import KMIX, { type KmixOptions } from 'k-mix-api'

const midi = await navigator.requestMIDIAccess()
const kmix = new KMIX(midi)
kmix.on('fader-1', (data) => console.log('fader-1', data))
```
```

Leave the rest of the README (Options, Events, control list, etc.) intact — that documentation still describes the current behavior.

- [ ] **Step 4: Add the release changeset**

`.changeset/k-mix-api-2-0.md`:

```md
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

Breaking: the package is now ESM-only; the UMD/IIFE CDN builds and the
`jsdelivr`/`unpkg` entry points are removed.
```

- [ ] **Step 5: Final full verification**

Run:
```bash
pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run coverage && pnpm run build
```
Expected: all green; coverage report shows `src/**` covered; `dist/` contains `index.js`, `index.js.map`, `index.d.ts`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat!: TypeScript 2.0 rewrite on midi-ports; remove legacy JS"
```

---

## Self-Review

**Spec coverage:**
- §2.1 parity — construction (Task 9), options full/terse/merge (Tasks 3–4), `send` routings incl. preset/raw/expander (Tasks 5–6, 9), `isConnected` four selectors (Task 9), `help` four requests (Task 8), events incl. `:off`/`any`/connected/disconnected (Tasks 7, 9), debug modes (Task 7 handler; `'state'`/`true` carried via `debug`). ✅
- §3 tooling — Task 1 covers every config file + scripts + CI/release. ✅
- §4 source architecture — one task per module, matching the file list. ✅
- §5 adopt midi-ports — Task 9 (`createMidiPorts`, device config, connection events, hot-plug re-attach). ✅
- §6 dependency replacement — eventemitter3 (Task 2), lodash/camelcase (Tasks 4–8 native), single runtime dep `midi-ports` (Task 1 package.json). ✅
- §7 cleanups — DOM coupling removed (Task 7), `performance.now()` guarded (Task 9 `now()`), CHANGESLOG→CHANGELOG rename (Task 1). ✅
- §8 testing — `midi-ports/testing` mock used (Tasks 9–10). ✅
- §9 decisions — ISC kept, OIDC release, midi-ports direct dep, 2.0.0 changeset (Tasks 1, 11). ✅

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every command has an expected result. ✅

**Type consistency:** `mergeOptions`/`UserOptions` (Task 4) consumed by `KMIX` (Task 9) and re-exported (Task 10). `KmixOptions`/`ControlSetting` defined in Task 3, used in Tasks 4–9. `MessageHandlerContext`/`handleMidiMessage` signature defined in Task 7, called in Task 9 with `{ banks, options, emitter, debug }`. `EventEmitter.emit/on/listenerCount` defined in Task 2, used in Tasks 7 and 9. `Port`/`MidiPorts` come from `midi-ports`. All consistent. ✅

**Deferred (not in this plan):** browser demo/playground (spec §9.3).
```
