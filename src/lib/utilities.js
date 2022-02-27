import camelcase from 'camelcase'
import { isArray, zipObject } from 'lodash';

function isEqual(a, b){
	return a === b;
}

function format(string){
	return string.toLowerCase().replace(/\s/g, '-').replace(',','')
}

function convertOptions(user, names){
	let newOptions = {}
	for(let o in user){
		if(o === 'midi-channels' || !isArray(user[o])){
			newOptions[o] = user[o]
		} else {
			newOptions[o] = arraysToObject(user[o], names)
		}
	}
	return newOptions;
}

function arraysToObject(values, names){
	return zipObject(names, values)
}

function convertRange( value, r1, r2 ) {
  return ( value - r1[ 0 ] ) * ( r2[ 1 ] - r2[ 0 ] ) / ( r1[ 1 ] - r1[ 0 ] ) + r2[ 0 ];
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

// device connection and port storing
function storePortConnections(port, device) {
	const {
		name,
		type,
		state
	} = port

	if(!name.includes(device.deviceName)) return

	const cleanName = camelcase(name.replace(`${device.deviceName} `,''))

	device.connections[cleanName][type] = state === 'connected' ? true : false

	device[cleanName][type] = port
}

exports.isEqual = isEqual
exports.format = format
exports.convertOptions = convertOptions
exports.arraysToObject = arraysToObject
exports.convertRange = convertRange
exports.payload = payload
exports.anyPayload = anyPayload
exports.storePortConnections = storePortConnections