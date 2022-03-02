import zipObject from 'lodash.zipobject';
import camelcase from 'camelcase'

export function isEqual(a, b){
	return a === b;
}

export function format(string){
	return string.toLowerCase().replace(/\s/g, '-').replace(',','')
}

export function convertOptions(user, names){
	let newOptions = {}
	for(let o in user){
		if(o === 'midi-channels' || !Array.isArray(user[o])){
			newOptions[o] = user[o]
		} else {
			newOptions[o] = arraysToObject(user[o], names)
		}
	}
	return newOptions;
}

export function arraysToObject(values, names){
	return zipObject(names, values)
}

export function convertRange( value, r1, r2 ) {
  return ( value - r1[ 0 ] ) * ( r2[ 1 ] - r2[ 0 ] ) / ( r1[ 1 ] - r1[ 0 ] ) + r2[ 0 ];
}

export function payload(data){
 	return {
		channel: (data[0] & 0xf) + 1,
		value:  data[2],
		raw: data
	}
}

export function anyPayload(control, data){
 	return {
 		control: control,
		channel: (data[0] & 0xf) + 1,
		value: data[2],
		raw: data
	}
}

// device connection and port storing
export function storePortConnections(port, device) {
	const {
		name,
		type,
		state
	} = port

	if(!name.includes(device.deviceName)) return

	const cleanName = camelcase(name.replace(`${device.deviceName} `,''))
	
	// ignore HUI
	if(cleanName.includes('Hui')) return

	device.connections[cleanName][type] = state === 'connected' ? true : false

	device[cleanName][type] = port
}
