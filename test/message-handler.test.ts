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
    handleMidiMessage(midiEvent([176, 1, 100]), ctx(ee))
    expect(fn).toHaveBeenCalledWith({ channel: 1, value: 100, raw: [176, 1, 100] })
  })

  test('emits a :off variant for note-off (128)', () => {
    const ee = new EventEmitter()
    const fn = vi.fn()
    ee.on('button-vu:off', fn)
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
