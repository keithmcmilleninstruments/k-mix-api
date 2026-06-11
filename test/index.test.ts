import { createMockMidi } from 'midi-ports/testing'
import { expect, test } from 'vitest'
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
