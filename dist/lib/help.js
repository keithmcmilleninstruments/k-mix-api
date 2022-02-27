function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// vendor
import { omit } from "lodash"; // modules

import { messages as CCTables } from "./control-message";

function helpObject(obj) {
  var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'control';
  return Object.keys(obj).map(function (key) {
    var _ref;

    return _ref = {}, _defineProperty(_ref, message, key), _defineProperty(_ref, "CC", obj[key]), _ref;
  });
}

function help(options, request) {
  switch (request) {
    case 'input':
      console.log('\nhelp:input');
      console.table(helpObject(CCTables[0], 'control: per-channel 1 -8'));
      break;

    case 'main':
      console.log('\nhelp:main');
      console.table(helpObject(CCTables[1], 'control: channel 9 (auto)'));
      break;

    case 'misc':
      console.log('\nhelp:misc');
      console.table(helpObject(CCTables[2], 'control: channel 10 (auto)'));
      break;

    case 'control':
      console.log('\nhelp:control. What channels are assigned to each control/bank, Editor MIDI tab');
      console.table(omit(options, 'midi-channels')); // omit type

      break;
  }
}

exports.help = help;
exports.helpObject = helpObject;