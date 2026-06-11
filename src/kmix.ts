import { createMidiPorts, type MidiPortEvent, type MidiPorts, type Port } from 'midi-ports'
import { controlMessageFromOptions } from './build-message.js'
import { controlMessage, getControlType } from './control-messages.js'
import type { KmixOptions } from './defaults.js'
import { EventEmitter } from './emitter.js'
import { help as helpRequest } from './help.js'
import { handleMidiMessage } from './message-handler.js'
import { mergeOptions, type UserOptions } from './options.js'

export type KmixDebug = boolean | 'state'
export type ConnectionQuery = 'all' | 'audio-control' | 'control-surface' | 'expander'

const DEVICES = {
  'audio-control': { ports: ['k-mix-audio-control'] },
  'control-surface': { ports: ['k-mix-control-surface'] },
  expander: { ports: ['k-mix-expander'] },
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : 0
}

export class KMIX extends EventEmitter {
  readonly deviceName = 'K-Mix'
  readonly options: KmixOptions
  readonly banks = ['bank_1', 'bank_2', 'bank_3']
  private readonly ports: MidiPorts
  private readonly debug: KmixDebug

  constructor(midi: MIDIAccess, userOptions: UserOptions = {}, debug: KmixDebug = false) {
    super()
    this.debug = debug
    this.options = mergeOptions(userOptions)
    this.ports = createMidiPorts(midi, { devices: DEVICES })

    // statechange covers connect, disconnect, and 'change' (a half-connected
    // port gaining its other half) — the latter never fires on connect/disconnect.
    this.ports.on('statechange', (event) => this.onConnectionChange(event))

    this.attachInput()

    if (!this.controlSurface?.input) {
      console.error('> K-Mix API: Control Surface Port not connected')
    }
  }

  get audioControl(): Port | undefined {
    return this.ports.get('k-mix-audio-control')
  }
  get controlSurface(): Port | undefined {
    return this.ports.get('k-mix-control-surface')
  }
  get expander(): Port | undefined {
    return this.ports.get('k-mix-expander')
  }

  private attachInput(): void {
    const input = this.controlSurface?.input
    if (!input) return
    input.onmidimessage = (event) =>
      handleMidiMessage(event, {
        banks: this.banks,
        options: this.options,
        emitter: this,
        debug: this.debug,
      })
  }

  private bothConnected(port?: Port): boolean {
    return !!(port?.input && port?.output)
  }

  private onConnectionChange(event: MidiPortEvent): void {
    if (this.debug === 'state') console.log('>> K-Mix State', event.port)
    // Re-attach the inbound listener so input keeps working after a reconnect.
    this.attachInput()
    const all = [this.audioControl, this.controlSurface, this.expander]
    if (all.every((p) => this.bothConnected(p))) this.emit('connected')
    if (all.every((p) => !(p?.input || p?.output))) this.emit('disconnected')
  }

  send(control: string | number[], value?: number | number[], bank = 1, time = 0): void {
    const controlType = getControlType(control)
    let sendTime = Number(time) || 0
    let message: number[] | undefined
    let output: MIDIOutput | undefined

    switch (controlType) {
      case 'raw':
        message = control as number[]
        output = this.audioControl?.output
        // raw form is send([...], time): the time rides in the value slot.
        sendTime = typeof value === 'number' ? value : 0
        break
      case 'raw-control':
        message = value as number[]
        output = this.controlSurface?.output
        break
      case 'control': {
        const name = (control as string).split(':')[1] ?? ''
        message = controlMessageFromOptions(name, value as number, bank, this.options)
        output = this.controlSurface?.output
        break
      }
      case 'raw-expander':
      case 'expander':
        message = value as number[]
        output = this.expander?.output
        break
      default:
        message = controlMessage(control as string, value as number, controlType)
        output = this.audioControl?.output
        break
    }

    if (!message || (message.length < 3 && controlType !== 'preset')) {
      console.warn('>> K-Mix: Please check control name')
      return
    }
    output?.send(message, now() + sendTime)
  }

  isConnected(port: ConnectionQuery | string = 'all'): boolean {
    switch (port) {
      case 'all':
        return [this.audioControl, this.controlSurface, this.expander].every((p) =>
          this.bothConnected(p),
        )
      case 'audio-control':
        return this.bothConnected(this.audioControl)
      case 'control-surface':
        return this.bothConnected(this.controlSurface)
      case 'expander':
        return this.bothConnected(this.expander)
      default:
        return false
    }
  }

  help(request: string): void {
    helpRequest(this.options, request)
  }
}
