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
