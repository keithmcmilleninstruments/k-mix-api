import { messages } from './control-tables.js'
import type { ControlSetting, KmixOptions } from './defaults.js'

/** Classify a control argument into its routing/message type. */
export function getControlType(control: string | number[]): string {
  if (Array.isArray(control)) return 'raw'
  const split = control.split(':')
  if (control === 'control') return 'raw-control'
  if (split[0] === 'control') return 'control'
  if (control === 'expander') return 'raw-expander'
  if (split[0] === 'expander') return 'expander'
  if (split[1] !== undefined && !Number.isNaN(Number(split[1]))) return 'input'
  return split[0] ?? ''
}

const MESSAGE_TYPES = ['input', 'main', 'misc', 'preset']
const CHANNEL_TYPES = [1, 9, 10, 1]

/** Build a MIDI message for an audio-control parameter from the CC tables. */
export function controlMessage(control: string, value: number, messageType = 'input'): number[] {
  const split = control.split(':')
  let controlName: string
  let inputChannel = 0
  let type: number
  let cc: number | null

  if (messageType === 'input') {
    controlName = split[0] ?? ''
    inputChannel = Number(split[1])
  } else {
    controlName = split[1] ?? ''
  }

  if (control === 'preset') {
    type = 192
    cc = null
    messageType = 'preset'
  } else {
    type = 176
    const idx = MESSAGE_TYPES.indexOf(messageType)
    const table = messages[idx]
    cc = table ? (table[controlName] ?? null) : null
  }

  const channel =
    messageType === 'input'
      ? inputChannel
      : (CHANNEL_TYPES[MESSAGE_TYPES.indexOf(messageType)] ?? 1)

  type = type + channel - 1
  return [type, cc, value].filter((x): x is number => x != null)
}

/** Find the control name whose `type` includes `eventType` and whose `bank` value equals `value`. */
export function findControl(
  value: number,
  eventType: number,
  bank: string,
  options: KmixOptions,
): string | undefined {
  return Object.keys(options).find((key) => {
    const setting = options[key]
    if (!setting || Array.isArray(setting)) return false
    const { type } = setting as ControlSetting
    const bankValue = (setting as unknown as Record<string, unknown>)[bank]
    return Array.isArray(type) && type.indexOf(eventType) !== -1 && bankValue === value
  })
}

/** Resolve which bank a given incoming MIDI channel belongs to. */
export function findBank(
  banks: string[],
  channel: number,
  options: KmixOptions,
): string | undefined {
  return banks[options['midi-channels'].indexOf(channel + 1)]
}
