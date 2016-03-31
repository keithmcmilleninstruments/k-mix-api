// vendor
import EventEmitter from 'eventemitter3';
import { merge, findKey, indexOf, isArray, initial, omit, partial } from "lodash"

// modules
import { isEqual, convertOptions, arraysToObject, helpObject } from './lib/utilities'
import deviceData from './lib/device-data';
import createDeviceList from 'midi-ports';
import kmixDefaults from "./lib/kmix-defaults";
import controlMessageFromOptions from './lib/control-message-from-options';
import { default as controlMessage , findControl, findBank, findIndex } from "./lib/control-message";
import help from "./lib/help";

let events = new EventEmitter(),
		device = 'k-mix', options = {},
		names = ['bank_1', 'bank_2', 'bank_3', 'mode'],
		banks = initial(names)
// debug
let kmixLog = document.querySelector('#kmixlog');

let KMIX = function KMIX(midi, userOptions = {}, debug = false){
	let newOptions = convertOptions(userOptions, names)
	// make options
	options = merge(kmixDefaults, newOptions)
	// make devices object
	let devices = createDeviceList(midi, deviceData)
	// set message handlers
	let input = midi.inputs.get(devices[device]['k-mix-control-surface'].inputID)	

	if(debug){
		let inputDebug = midi.inputs.get(devices[device]['k-mix-audio-control'].inputID)
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
		},
		emit: function emit(event, data){
			events.emit(event, data);
		},
		send: function send(control, value, controlType, time, bank = 1){
			let output, message, 
					device = 'k-mix-audio-control', 
					controlSplit = (isArray(control)) ? '' : control.split(':');
			
			time = time || 0

			if(isArray(control)){ // raw to either
				message = control
				time = value
				device = (controlType && controlType.toLowerCase() === 'control') ? 'k-mix-control-surface' : 'k-mix-audio-control';
			} else if(controlSplit[0].toLowerCase() === 'control') { // to control-surface
					device = 'k-mix-control-surface'
					control = controlSplit[1]
					
					// message type logic
					if(control.toLowerCase().includes('button')){
						if(controlSplit[2] && controlSplit[2].toLowerCase() === 'off'){
							controlType = 'off'
						} else {
							controlType = 'on'
							// ........... buttons 0 = off, 1-127 = on, same type. must be set to toggle
						}
					} else {
						controlType = 'cc'
					}
					message = controlMessageFromOptions(control, value, controlType, bank, options)
			} else { // to audio-control : default
				message = controlMessage(control, value, controlType)
			}
			
			output = midi.outputs.get(devices['k-mix'][device].outputID)
			
			if(control !== 'preset' && message.length < 3) {
				throw new Error('Please check control name');
			} else {
				output.send(message, time)
			}
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
			device = '', 
			controlName = '',
			kind = '';

	device = e.target.name;

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
			'device:'  : device,
			'port:'    : e.target.id,
			'data:'    : data,
			'channel:' : (channel + 1)
		}

		if(device === 'K-Mix Audio Control'){
			debugLog = omit(debugLog, 'control:')
			debugLog['channel:'] = data[7] + 1
		}

		console.log('Event Debug', debugLog);	
	}
	if(kmixLog) kmixLog.innerHTML = controlName + '<br>from ' + device + '<br>port ' + e.target.id + '<br>' + data + '<br>channel ' + (channel + 1);
}

function payload(data){
	let value = data[2];
 	return {
		value: value / 127,
		deg: (value / 127) * 360,
		rad:  (value / 127) * 360 * Math.PI / 180,
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