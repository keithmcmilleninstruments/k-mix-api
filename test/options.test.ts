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
  const merged = deepMerge({ a: { x: 1, y: 2 }, b: 3 }, { a: { y: 9 }, b: undefined })
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
