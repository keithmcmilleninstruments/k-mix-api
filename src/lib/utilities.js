import { isArray, zipObject } from 'lodash';

export function isEqual(a, b){
	return a === b;
}

export function format(string){
	return string.toLowerCase().replace(/\s/g, '-').replace(',','')
}

export function convertOptions(user, names){
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

export function arraysToObject(values, names){
	return zipObject(names, values)
}

export function convertRange( value, r1, r2 ) {
  return ( value - r1[ 0 ] ) * ( r2[ 1 ] - r2[ 0 ] ) / ( r1[ 1 ] - r1[ 0 ] ) + r2[ 0 ];
}

export function payload(data){
	let value = data[2];
 	return {
		value: value,
		raw: data
	}
}

export function anyPayload(control, data){
	let value = data[2];
 	return {
 		control: control,
		value: value,
		raw: data
	}
}
