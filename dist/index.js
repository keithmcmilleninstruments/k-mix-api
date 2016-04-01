'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = undefined;

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _lodash = require('lodash');

var _utilities = require('./lib/utilities');

var _deviceData = require('./lib/device-data');

var _deviceData2 = _interopRequireDefault(_deviceData);

var _midiPorts = require('midi-ports');

var _midiPorts2 = _interopRequireDefault(_midiPorts);

var _kmixDefaults = require('./lib/kmix-defaults');

var _kmixDefaults2 = _interopRequireDefault(_kmixDefaults);

var _controlMessageFromOptions = require('./lib/control-message-from-options');

var _controlMessageFromOptions2 = _interopRequireDefault(_controlMessageFromOptions);

var _controlMessage = require('./lib/control-message');

var _controlMessage2 = _interopRequireDefault(_controlMessage);

var _help = require('./lib/help');

var _help2 = _interopRequireDefault(_help);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var events = new _eventemitter2.default(),
    device = 'k-mix',
    options = {},
    ports = ['k-mix-audio-control', 'k-mix-control-surface'],
    names = ['bank_1', 'bank_2', 'bank_3', 'mode'],
    banks = (0, _lodash.initial)(names);

// debug


// modules
// vendor
var kmixLog = document.querySelector('#kmixlog');

var KMIX = function KMIX(midi) {
	var userOptions = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
	var debug = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

	if (!midi) {
		throw 'MIDI Access object is mandatory.';
	}
	var newOptions = (0, _utilities.convertOptions)(userOptions, names);
	// make options
	options = (0, _lodash.merge)(_kmixDefaults2.default, newOptions);
	// make devices object
	var devices = (0, _midiPorts2.default)(midi, _deviceData2.default);
	// set message handlers
	var input = midi.inputs.get(devices[device][ports[1]].inputID);

	if (debug) {
		var inputDebug = midi.inputs.get(devices[device][ports[0]].inputID);
		inputDebug.onmidimessage = function (e) {
			// add formatted console logging
			midiEventHandler(e, true);
		};
		input.onmidimessage = function (e) {
			// add formatted console logging
			midiEventHandler(e, true);
		};
	} else {
		input.onmidimessage = midiEventHandler;
	}

	return {
		on: function on(event, data) {
			events.on(event, data);
		},
		emit: function emit(event, data) {
			events.emit(event, data);
		},
		send: function send(control, value, time) {
			var bank = arguments.length <= 3 || arguments[3] === undefined ? 1 : arguments[3];

			var output = void 0,
			    message = void 0,
			    port = ports[0],
			    controlType = (0, _controlMessage.getControlType)(control);
			console.log('controlType', controlType);

			time = time || 0;

			switch (controlType) {
				case 'raw':
					// raw : send([176,1,127], time)
					message = control;
					time = value || 0;
					port = ports[0];

					break;

				case 'raw-control':
					// raw-control : send('control',[176,1,127], time)
					message = value;
					port = ports[1];

					break;

				case 'control':
					// to control-surface : send('control:button-vu',0), send('control:fader-1', 64)
					port = ports[1];
					control = control.split(':')[1];
					message = (0, _controlMessageFromOptions2.default)(control, value, bank, options);

					break;

				default:
					// 'input', 'main', 'misc', 'preset'
					// to audio control : send('fader:1', value, time)
					message = (0, _controlMessage2.default)(control, value, controlType);
					break;
			}

			output = midi.outputs.get(devices[device][port].outputID);

			if (message.length < 3 && controlType !== 'preset') {
				console.log('Please check control name');
			} else {
				output.send(message, window.performance.now() + time);
			}
		},
		help: (0, _lodash.partial)(_help2.default, options)
	};
};

function midiEventHandler(e) {
	var debug = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

	var data = e.data,
	    type = data[0] & 0xf0,
	    channel = data[0] & 0xf,
	    control = data[1],
	    bank = (0, _controlMessage.findBank)(banks, channel, options),
	    device = '',
	    controlName = '',
	    kind = '';

	device = e.target.name;

	// find control; 'fader-1'
	controlName = (0, _controlMessage.findControl)(control, type, bank, options);
	// emit ':off' if 128
	if (type === 128) kind = ':off';
	// send out event for controlName
	events.emit(controlName + kind, payload(data));
	// if listening for any event
	if (events.listeners('any', true)) {
		events.emit('any', anyPayload(controlName + kind, data));
	}

	// debug to console
	if (debug) {
		var debugLog = {
			'control:': controlName,
			'device:': device,
			'port:': e.target.id,
			'data:': data,
			'channel:': channel + 1
		};

		if (device === 'K-Mix Audio Control') {
			debugLog = (0, _lodash.omit)(debugLog, 'control:');
			debugLog['channel:'] = data[7] + 1;
		}

		console.log('Event Debug', debugLog);
	}
	if (kmixLog) kmixLog.innerHTML = controlName + '<br>from ' + device + '<br>port ' + e.target.id + '<br>' + data + '<br>channel ' + (channel + 1);
}

function payload(data) {
	var value = data[2];
	return {
		value: value / 127,
		deg: value / 127 * 360,
		rad: value / 127 * 360 * Math.PI / 180,
		raw: data
	};
}

function anyPayload(control, data) {
	var value = data[2];
	return {
		control: control,
		value: value,
		raw: data
	};
}

exports.default = KMIX;