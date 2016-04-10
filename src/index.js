// vendor
import EventEmitter from 'eventemitter3';
import { merge, findKey, indexOf, isArray, initial, omit, partial } from "lodash"

// modules
import { isEqual, convertOptions, arraysToObject, helpObject } from './lib/utilities'
import deviceData from './lib/device-data';
import createDeviceList from 'midi-ports';
import kmixDefaults from "./lib/kmix-defaults";
import controlMessageFromOptions from './lib/control-message-from-options';
import { default as controlMessage, getControlType, findControl, findBank, findIndex } from "./lib/control-message";
import help from "./lib/help";

let events = new EventEmitter(),
		device = 'k-mix', options = {},
		ports = ['k-mix-audio-control', 'k-mix-control-surface'],
		names = ['bank_1', 'bank_2', 'bank_3', 'mode'],
		banks = initial(names)

// debug
let kmixLog = document.querySelector('#kmixlog');

let KMIX = function KMIX(midi, userOptions = {}, debug = false){
	if (!midi) {
		throw 'MIDI Access object is mandatory.';
	}

	let newOptions = convertOptions(userOptions, names)
	// make options
	options = merge(kmixDefaults, newOptions)
	// make devices object
	let devices = createDeviceList(midi, deviceData)
	// set message handlers
	let input = midi.inputs.get(devices[device][ports[1]].inputID)	

	if(debug){
		let inputDebug = midi.inputs.get(devices[device][ports[0]].inputID)
		inputDebug.onmidimessage = function(e){
			// add formatted console logging
			midiEventHandler(e, true)
		}
		input.onmidimessage = function(e){
			// add formatted console logging
			midiEventHandler(e, true)
		}
	} else {
		input.onmidimessage = midiEventHandler
	}

	return {
		on: function on(event, data){
			events.on(event, data);
			// chaining
			return this
		},
		emit: function emit(event, data){
			events.emit(event, data);
			// chaining
			return this
		},
		send: function send(control, value, time, bank = 1){
			let output, message, 
					port = ports[0],
					controlType = getControlType(control);
			
			time = time || 0

			switch(controlType){
				case 'raw':
					// raw : send([176,1,127], time)
					message = control
					time = value || 0
					port = ports[0];
					
					break;

				case 'raw-control':
					// raw-control : send('control',[176,1,127], time)
					message = value
					port = ports[1];
					
					break;

				case 'control':
					// to control-surface : send('control:button-vu',0), send('control:fader-1', 64)
					port = ports[1];
					control = control.split(':')[1]
					message = controlMessageFromOptions(control, value, bank, options)
					
					break;

				default: // 'input', 'main', 'misc', 'preset'
					// to audio control : send('fader:1', value, time)
					message = controlMessage(control, value, controlType)

					break;
			}
			
			output = midi.outputs.get(devices[device][port].outputID)

			if(message.length < 3 && controlType !== 'preset') {
				console.log('Please check control name');
			} else {
				output.send(message,  window.performance.now() + time)
			}
			// chaining
			return this
		}, 
		help: partial(help, options)
	}
}

function midiEventHandler(e, debug = false){ 
	var data = e.data,
			type = data[0] & 0xf0,
			channel = data[0] & 0xf,
			control = data[1],
			bank = findBank(banks, channel, options),
			port = '', 
			controlName = '',
			kind = '';

	port = e.target.name;

	// find control; 'fader-1'
	controlName = findControl(control, type, bank, options)
	// emit ':off' if 128 
	if(type === 128) kind = ':off';
	// send out event for controlName
	events.emit(controlName + kind, payload(data))
	// if listening for any event
	if(events.listeners('any', true)){
		events.emit('any', anyPayload(controlName + kind, data))
	}

	// debug to console
	if(debug){
		let debugLog = { 
			'control:' : controlName, 
			'port:'  : port,
			'portID:'    : e.target.id,
			'data:'    : data,
			'channel:' : (channel + 1)
		}

		if(port === 'K-Mix Audio Control'){
			debugLog = omit(debugLog, 'control:')
			debugLog['channel:'] = data[7] + 1
		}

		console.log('Event Debug', debugLog);	
	}
	if(kmixLog) kmixLog.innerHTML = controlName + '<br>from ' + port + '<br>portID ' + e.target.id + '<br>' + data + '<br>channel ' + (channel + 1);
}

function payload(data){
	let value = data[2];
 	return {
		value: value,
		raw: data
	}
}

function anyPayload(control, data){
	let value = data[2];
 	return {
 		control: control,
		value: value,
		raw: data
	}
}

export { KMIX as default }