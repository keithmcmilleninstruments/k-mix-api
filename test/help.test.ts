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
