// vendor
import { without, findKey, indexOf } from 'lodash'

// modules
import { isEqual } from './utilities'
import { input_channel_params, main_output_bus_params, misc_params } from './kmix-control-messages'

let messages = [input_channel_params, main_output_bus_params, misc_params];

function findControl(value, eventType, bank, options){
	return findKey(options, function(o) {
		return findIndex(eventType, o.type) != -1 && isEqual(o[bank], value); 
	});
}

function findIndex(value, array){
	let index = indexOf(array, value);
	return index;
}

function findBank(banks, channel, options){
	return banks[indexOf(options['midi-channels'], channel + 1)];
}

function getControlType(control){
	let controlType = '', controlSplit = control.split(':')
 // raw, raw-control, control, input, main, misc, preset
	if(Array.isArray(control)){ // raw
		controlType = 'raw'
	} else if(control === 'control'){ // raw-control
		controlType = 'raw-control'
	} else if(controlSplit[0] === 'control'){ // control
		controlType = 'control'
	} else if(!isNaN(controlSplit[1])){ // input
		controlType = 'input'
	} else { // main, misc, preset
		controlType = controlSplit[0]
	}

	return controlType
}

function controlMessage(control, value, messageType = 'input'){
	let messageTypes = ['input', 'main', 'misc', 'preset'],
			channelTypes = [1, 9, 10, 1],
			controlSplit = control.split(':'), 
			controlName = controlSplit[0],
			inputChannel = +controlSplit[1],
			type, cc;

			if(control === 'preset'.toLowerCase()){
				type = 192
				cc = null
				messageType = 'preset'
			} else {
				type = 176
				cc = messages[messageTypes.indexOf(messageType)][controlName];
			}

			let channel = (messageType === 'input') ? inputChannel : channelTypes[messageTypes.indexOf(messageType)];

	type = type + channel - 1;

	let message = [type, cc, value];

	return without(message, undefined, null);
}

export { controlMessage as default, findControl, getControlType, findBank, findBank, messages };