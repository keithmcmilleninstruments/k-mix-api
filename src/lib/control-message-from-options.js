// vendor
import { without } from 'lodash'

function controlMessageFromOptions(control, value, bank, options){
	let banks = ['bank_1', 'bank_2', 'bank_3'],
			channel = options['midi-channels'][bank - 1],
			cc = options[control][banks[bank - 1]],
			type = 0

	if(control.includes('fader') || control.includes('rotary')){
		type = 176
	} else {
		if(value === 0){
			type = 128
		} else {
			type = 144
			value = 127
		}
	}

	type = type + channel - 1

	if(!type) throw new Error('Check control name')

	let message = [type, cc, value]

	return without(message, undefined, null);
}

export { controlMessageFromOptions as default }