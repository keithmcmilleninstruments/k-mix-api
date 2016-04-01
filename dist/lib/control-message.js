'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.messages = exports.findBank = exports.getControlType = exports.findControl = exports.default = undefined;

var _lodash = require('lodash');

var _utilities = require('./utilities');

var _kmixControlMessages = require('./kmix-control-messages');

// modules


var messages = [_kmixControlMessages.input_channel_params, _kmixControlMessages.main_output_bus_params, _kmixControlMessages.misc_params]; // vendor


function findControl(value, eventType, bank, options) {
	return (0, _lodash.findKey)(options, function (o) {
		return findIndex(eventType, o.type) != -1 && (0, _utilities.isEqual)(o[bank], value);
	});
}

function findIndex(value, array) {
	var index = (0, _lodash.indexOf)(array, value);
	return index;
}

function findBank(banks, channel, options) {
	return banks[(0, _lodash.indexOf)(options['midi-channels'], channel + 1)];
}

function getControlType(control) {
	var controlType = '',
	    controlSplit = control.split(':');
	// raw, raw-control, control, input, main, misc, preset
	if (Array.isArray(control)) {
		// raw
		controlType = 'raw';
	} else if (control === 'control') {
		// raw-control
		controlType = 'raw-control';
	} else if (controlSplit[0] === 'control') {
		// control
		controlType = 'control';
	} else if (!isNaN(controlSplit[1])) {
		// input
		controlType = 'input';
	} else {
		// main, misc, preset
		controlType = controlSplit[0];
	}

	return controlType;
}

function controlMessage(control, value) {
	var messageType = arguments.length <= 2 || arguments[2] === undefined ? 'input' : arguments[2];

	var messageTypes = ['input', 'main', 'misc', 'preset'],
	    channelTypes = [1, 9, 10, 1],
	    controlSplit = control.split(':'),
	    controlName = controlSplit[0],
	    inputChannel = +controlSplit[1],
	    type = void 0,
	    cc = void 0;

	if (control === 'preset'.toLowerCase()) {
		type = 192;
		cc = null;
		messageType = 'preset';
	} else {
		type = 176;
		cc = messages[messageTypes.indexOf(messageType)][controlName];
	}

	var channel = messageType === 'input' ? inputChannel : channelTypes[messageTypes.indexOf(messageType)];

	type = type + channel - 1;

	var message = [type, cc, value];

	return (0, _lodash.without)(message, undefined, null);
}

exports.default = controlMessage;
exports.findControl = findControl;
exports.getControlType = getControlType;
exports.findBank = findBank;
exports.findBank = findBank;
exports.messages = messages;