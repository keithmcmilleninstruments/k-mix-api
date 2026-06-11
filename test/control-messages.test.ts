import { expect, test } from 'vitest'
import { controlMessage, findBank, findControl, getControlType } from '../src/control-messages.js'
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
  expect(controlMessage('fader:1', 100, 'input')).toEqual([176, 1, 100])
  expect(controlMessage('mute:3', 64, 'input')).toEqual([178, 2, 64])
})

test('controlMessage builds main/misc messages on their fixed channels', () => {
  expect(controlMessage('main:fader', 100, 'main')).toEqual([184, 1, 100])
  expect(controlMessage('misc:reverb-level', 50, 'misc')).toEqual([185, 13, 50])
})

test('controlMessage builds a 2-byte program-change for preset', () => {
  expect(controlMessage('preset', 5, 'preset')).toEqual([192, 5])
})

test('findBank maps a MIDI channel to a bank name', () => {
  expect(findBank(['bank_1', 'bank_2', 'bank_3'], 0, KMIXDefaults)).toBe('bank_1')
  expect(findBank(['bank_1', 'bank_2', 'bank_3'], 2, KMIXDefaults)).toBe('bank_3')
})

test('findControl resolves a control name from value/type/bank', () => {
  expect(findControl(12, 144, 'bank_1', KMIXDefaults)).toBe('button-vu')
  expect(findControl(1, 176, 'bank_1', KMIXDefaults)).toBe('fader-1')
})
