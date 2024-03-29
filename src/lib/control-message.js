// vendor
import without from 'lodash.without'
import findKey from 'lodash.findkey'
import indexOf from 'lodash.indexof'

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
	return indexOf(array, value);
}

function findBank(banks, channel, options){
	return banks[indexOf(options['midi-channels'], channel + 1)];
}

function getControlType(control){
	let controlType = '', controlSplit = ''
 // raw, raw-control, control, input, main, misc, preset
	if(Array.isArray(control)){ // raw
		controlType = 'raw'
	} else {
		controlSplit = control.split(':')
		if(control === 'control'){ // raw-control
			controlType = 'raw-control'
		} else if(controlSplit[0] === 'control'){ // control
			controlType = 'control'
		} else if(control === 'expander'){ // raw-expander
			controlType = 'raw-expander'
		} else if(controlSplit[0] === 'expander'){ // expander
			controlType = 'expander'
		} else if(!isNaN(controlSplit[1])){ // input
			controlType = 'input'
		} else { // main, misc, preset
			controlType = controlSplit[0]
		}
	}

	return controlType
}

function controlMessage(control, value, messageType = 'input'){
	let messageTypes = ['input', 'main', 'misc', 'preset'],
			channelTypes = [1, 9, 10, 1],
			controlSplit = control.split(':'),
			controlName,
			inputChannel,
			type, cc;

			if(messageType === 'input'){
				controlName = controlSplit[0]
				inputChannel = +controlSplit[1]
			} else {
				controlName = controlSplit[1]
			}

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

export {
	controlMessage,
	findControl,
	getControlType,
	findBank,
	messages
}
