'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.convertRange = exports.arraysToObject = exports.convertOptions = exports.format = exports.isEqual = undefined;

var _lodash = require('lodash');

function isEqual(a, b) {
	return a === b;
}

function format(string) {
	return string.toLowerCase().replace(/\s/g, '-').replace(',', '');
}

function convertOptions(user, names) {
	var newOptions = {};
	for (var o in user) {
		if (o === 'midi-channels' || !(0, _lodash.isArray)(user[o])) {
			newOptions[o] = user[o];
		} else {
			newOptions[o] = arraysToObject(user[o], names);
		}
	}
	return newOptions;
}

function arraysToObject(values, names) {
	return (0, _lodash.zipObject)(names, values);
}

function convertRange(value, r1, r2) {
	return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
}

exports.isEqual = isEqual;
exports.format = format;
exports.convertOptions = convertOptions;
exports.arraysToObject = arraysToObject;
exports.convertRange = convertRange;