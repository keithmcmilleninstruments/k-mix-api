import { omit } from "lodash"

import { findControl, findBank } from "./control-message";
import { payload, anyPayload } from "./utilities"

// debug
let kmixLog = document.querySelector('#kmixlog');

export default function midiMessageHandler(event, device){
	let data = event.data,
			type = data[0] & 0xf0,
			channel = data[0] & 0xf,
			control = data[1],
			bank = findBank(device.banks, channel, device.options),
			port = '',
			controlName = '',
			kind = '';

	port = event.target.name;

	// find control; 'fader-1'
	controlName = findControl(control, type, bank, device.options)
	// emit ':off' if 128
	if(type === 128) kind = ':off';
	// send out event for controlName
	device.emit(controlName + kind, payload(data))
	// if listening for any event
	if(device.listeners('any', true)){
		device.emit('any', anyPayload(controlName + kind, data))
	}

	// debug to console
	if(device._debug){
		let debugLog = {
			'control:' : controlName,
			'port:'  : port,
			'portID:'    : event.target.id,
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
