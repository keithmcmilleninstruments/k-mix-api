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
