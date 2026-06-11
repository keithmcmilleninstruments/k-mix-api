import { messages } from './control-tables.js'
import type { KmixOptions } from './defaults.js'

function helpObject(obj: Record<string, number>, label = 'control') {
  return Object.keys(obj).map((key) => ({ [label]: key, CC: obj[key] }))
}

/** Print K-Mix CC reference tables (input/main/misc) or the configured control map. */
export function help(options: KmixOptions, request: string): void {
  switch (request) {
    case 'input':
      console.log('\nhelp:input')
      console.table(helpObject(messages[0] ?? {}, 'control: per-channel 1 - 8'))
      break
    case 'main':
      console.log('\nhelp:main')
      console.table(helpObject(messages[1] ?? {}, 'control: channel 9 (auto)'))
      break
    case 'misc':
      console.log('\nhelp:misc')
      console.table(helpObject(messages[2] ?? {}, 'control: channel 10 (auto)'))
      break
    case 'control': {
      const { 'midi-channels': _channels, ...rest } = options
      console.log(
        '\nhelp:control. What channels are assigned to each control/bank, Editor MIDI tab',
        rest,
      )
      console.table(rest)
      break
    }
  }
}
