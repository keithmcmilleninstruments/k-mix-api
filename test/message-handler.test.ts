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

  test('unmatched control emits an empty-name control with payload', () => {
    const ee = new EventEmitter()
    const anyFn = vi.fn()
    ee.on('any', anyFn)
    // CC 176, control number 99 matches no configured control on bank_1
    handleMidiMessage(midiEvent([176, 99, 50]), ctx(ee))
    expect(anyFn).toHaveBeenCalledWith({ control: '', channel: 1, value: 50, raw: [176, 99, 50] })
  })

  test('debug=true logs Event Debug for a control-surface message', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const ee = new EventEmitter()
    handleMidiMessage(midiEvent([176, 1, 100]), {
      banks,
      options: mergeOptions({}),
      emitter: ee,
      debug: true,
    })
    expect(log).toHaveBeenCalledWith(
      'Event Debug',
      expect.objectContaining({ control: 'fader-1', port: 'K-Mix Control Surface' }),
    )
    log.mockRestore()
  })

  test('debug=true on the Audio Control port omits control and uses data[7] for channel', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const ee = new EventEmitter()
    const data = [176, 1, 100, 0, 0, 0, 0, 4] // data[7] = 4 -> channel 5
    handleMidiMessage(midiEvent(data, 'K-Mix Audio Control'), {
      banks,
      options: mergeOptions({}),
      emitter: ee,
      debug: true,
    })
    const arg = log.mock.calls.at(-1)?.[1] as Record<string, unknown>
    expect(arg).not.toHaveProperty('control')
    expect(arg.channel).toBe(5)
    log.mockRestore()
  })
})
