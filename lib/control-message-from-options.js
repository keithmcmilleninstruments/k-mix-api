function controlMessageFromOptions(control, value, controlType, bank, options){
	let banks = ['bank_1', 'bank_2', 'bank_3'],
			controlTypes = {'cc': 176, 'on': 144, 'off': 128},
			channel = options['midi-channels'][bank - 1],
			cc = options[control][banks[bank - 1]],
			type = controlTypes[controlType] + channel - 1;

	let message = [type, cc, value]

	return message
}

export { controlMessageFromOptions as default }