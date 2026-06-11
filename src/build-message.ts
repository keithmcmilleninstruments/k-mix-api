import type { ControlSetting, KmixOptions } from './defaults.js'

const BANKS = ['bank_1', 'bank_2', 'bank_3']

/** Build a MIDI message for a control-surface control from the merged options + bank. */
export function controlMessageFromOptions(
  control: string,
  value: number,
  bank: number,
  options: KmixOptions,
): number[] {
  const channel = options['midi-channels'][bank - 1]
  const bankKey = BANKS[bank - 1]
  const setting = options[control] as ControlSetting | undefined
  const cc =
    setting && bankKey ? (setting as unknown as Record<string, number>)[bankKey] : undefined

  let type: number
  let outValue = value
  if (control.includes('fader') || control.includes('rotary')) {
    type = 176
  } else if (value === 0) {
    type = 128
  } else {
    type = 144
    outValue = 127
  }

  if (channel === undefined) throw new Error('Check control name')
  type = type + channel - 1

  return [type, cc, outValue].filter((x): x is number => x != null)
}
