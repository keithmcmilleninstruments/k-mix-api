'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = undefined;

var _lodash = require('lodash');

function controlMessageFromOptions(control, value, bank, options) {
	var banks = ['bank_1', 'bank_2', 'bank_3'],
	    channel = options['midi-channels'][bank - 1],
	    cc = options[control][banks[bank - 1]];

	if (control.includes('fader') || control.includes('rotary')) {
		type = 176;
	} else {
		if (value === 0) {
			type = 128;
		} else {
			type = 144;
			value = 127;
		}
	}

	type = type + channel - 1;

	if (!type) throw new Error('Check control name');

	var message = [type, cc, value];

	return (0, _lodash.without)(message, undefined, null);
} // vendor


exports.default = controlMessageFromOptions;