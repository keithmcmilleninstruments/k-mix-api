"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.helpObject = exports.default = undefined;

var _lodash = require("lodash");

var _controlMessage = require("./control-message");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } // vendor

// modules


function helpObject(obj) {
	var message = arguments.length <= 1 || arguments[1] === undefined ? 'control' : arguments[1];

	return Object.keys(obj).map(function (key) {
		var _ref;

		return _ref = {}, _defineProperty(_ref, message, key), _defineProperty(_ref, "CC", obj[key]), _ref;
	});
}

function help(options, request) {
	switch (request) {
		case 'input':
			console.log('\nhelp:input');
			console.table(helpObject(_controlMessage.messages[0], 'control: per-channel'));
			break;
		case 'main_out':
			console.log('\nhelp:main_out');
			console.table(helpObject(_controlMessage.messages[1], 'control: channel 9 (auto)'));
			break;
		case 'misc':
			console.log('\nhelp:misc');
			console.table(helpObject(_controlMessage.messages[1], 'control: channel 10 (auto)'));
			break;
		case 'control':
			console.log('\nhelp:control. What channels are assigned to each control/bank');
			console.table((0, _lodash.omit)(options, 'midi-channels')); // omit type
			break;
	}
}

exports.default = help;
exports.helpObject = helpObject;