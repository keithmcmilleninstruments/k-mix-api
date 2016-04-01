// vendor
import { omit } from "lodash";
// modules
import { messages as CCTables } from "./control-message";

function helpObject(obj, message = 'control'){
	return Object.keys(obj).map(function(key){
	  return { [message] : key, CC: obj[key] };
	});
}

function help(options, request){
	switch(request){
		case 'input':
			console.log('\nhelp:input');
			console.table(helpObject(CCTables[0], 'control: per-channel 1 -8'))
			break;
		case 'main':
			console.log('\nhelp:main');
			console.table(helpObject(CCTables[1], 'control: channel 9 (auto)'))
			break;
		case 'misc':
			console.log('\nhelp:misc');
			console.table(helpObject(CCTables[1], 'control: channel 10 (auto)'))
			break;
		case 'control':
			console.log('\nhelp:control. What channels are assigned to each control/bank, Editor MIDI tab');
			console.table(omit(options, 'midi-channels')); // omit type
			break;
	}
}

export { help as default, helpObject }