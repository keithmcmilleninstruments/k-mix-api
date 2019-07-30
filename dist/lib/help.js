"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = help;
exports.helpObject = helpObject;

var _lodash = require("lodash");

var _controlMessage = require("./control-message");

// vendor
// modules
function helpObject(obj, message = 'control') {
  return Object.keys(obj).map(function (key) {
    return {
      [message]: key,
      CC: obj[key]
    };
  });
}

function help(options, request) {
  switch (request) {
    case 'input':
      console.log('\nhelp:input');
      console.table(helpObject(_controlMessage.messages[0], 'control: per-channel 1 -8'));
      break;

    case 'main':
      console.log('\nhelp:main');
      console.table(helpObject(_controlMessage.messages[1], 'control: channel 9 (auto)'));
      break;

    case 'misc':
      console.log('\nhelp:misc');
      console.table(helpObject(_controlMessage.messages[2], 'control: channel 10 (auto)'));
      break;

    case 'control':
      console.log('\nhelp:control. What channels are assigned to each control/bank, Editor MIDI tab');
      console.table((0, _lodash.omit)(options, 'midi-channels')); // omit type

      break;
  }
}