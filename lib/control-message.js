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

function controlMessage(control, value, messageType = 'input'){
	let messageTypes = ['input', 'main_out', 'misc', 'preset'],
			channelTypes = [1, 9, 10, 1],
			controlSplit = control.split(':'), 
			controlName = controlSplit[0],
			inputChannel = (controlSplit[1] === 'master'.toLowerCase()) ? 9 : +controlSplit[1],
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

export { controlMessage as default, findControl, findBank, findBank, messages };