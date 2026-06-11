import { createMockMidi, type MockMidi } from 'midi-ports/testing'
import { describe, expect, test, vi } from 'vitest'
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
    input.onmidimessage?.({
      data: Uint8Array.from([176, 1, 100]),
      target: input,
    } as unknown as MIDIMessageEvent)
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

  test('emits disconnected when the last port goes away', () => {
    const mock = fullRig()
    const kmix = new KMIX(mock.access)
    const fn = vi.fn()
    kmix.on('disconnected', fn)
    for (const p of PORTS) mock.disconnect(p)
    expect(fn).toHaveBeenCalled()
  })

  test('connected is edge-triggered: an unrelated port change does not re-emit', () => {
    const mock = fullRig()
    const kmix = new KMIX(mock.access)
    const fn = vi.fn()
    kmix.on('connected', fn)
    mock.connect({ id: 'other', name: 'Some Other Synth', type: 'output' })
    expect(fn).not.toHaveBeenCalled()
  })

  test('re-attaches input on hot-plug: inbound keeps working after reconnect', () => {
    const mock = fullRig()
    const kmix = new KMIX(mock.access)
    const fn = vi.fn()
    kmix.on('fader-1', fn)
    mock.disconnect({ id: 'cs-in', name: 'K-Mix Control Surface', type: 'input' })
    mock.connect({ id: 'cs-in', name: 'K-Mix Control Surface', type: 'input' })
    const input = mock.access.inputs.get('cs-in') as MIDIInput
    input.onmidimessage?.({
      data: Uint8Array.from([176, 1, 100]),
      target: input,
    } as unknown as MIDIMessageEvent)
    expect(fn).toHaveBeenCalledWith({ channel: 1, value: 100, raw: [176, 1, 100] })
  })
})
