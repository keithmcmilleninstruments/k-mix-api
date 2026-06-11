import { expect, test } from 'vitest'
import { controlMessageFromOptions } from '../src/build-message.js'
import { mergeOptions } from '../src/options.js'

const options = mergeOptions({})

test('fader/rotary controls produce CC (176) messages on the bank channel', () => {
  expect(controlMessageFromOptions('fader-1', 100, 1, options)).toEqual([176, 1, 100])
  expect(controlMessageFromOptions('rotary-1', 64, 2, options)).toEqual([177, 10, 64])
})

test('button press (value != 0) sends note-on 144 with value forced to 127', () => {
  expect(controlMessageFromOptions('button-vu', 1, 1, options)).toEqual([144, 12, 127])
})

test('button release (value === 0) sends note-off 128', () => {
  expect(controlMessageFromOptions('button-vu', 0, 1, options)).toEqual([128, 12, 0])
})
