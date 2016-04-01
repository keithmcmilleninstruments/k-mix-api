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

export { isEqual, format, convertOptions, arraysToObject, convertRange }