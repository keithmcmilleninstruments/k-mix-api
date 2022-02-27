"use strict";

var _lodash = require("lodash");

var _utilities = require("./utilities");

var _kmixControlMessages = require("./kmix-control-messages");

// vendor
// modules
var messages = [_kmixControlMessages.input_channel_params, _kmixControlMessages.main_output_bus_params, _kmixControlMessages.misc_params];

function findControl(value, eventType, bank, options) {
  return (0, _lodash.findKey)(options, function (o) {
    return findIndex(eventType, o.type) != -1 && (0, _utilities.isEqual)(o[bank], value);
  });
}

function findIndex(value, array) {
  return (0, _lodash.indexOf)(array, value);
}

function findBank(banks, channel, options) {
  return banks[(0, _lodash.indexOf)(options['midi-channels'], channel + 1)];
}

function getControlType(control) {
  var controlType = '',
      controlSplit = ''; // raw, raw-control, control, input, main, misc, preset

  if (Array.isArray(control)) {
    // raw
    controlType = 'raw';
  } else {
    controlSplit = control.split(':');

    if (control === 'control') {
      // raw-control
      controlType = 'raw-control';
    } else if (controlSplit[0] === 'control') {
      // control
      controlType = 'control';
    } else if (control === 'expander') {
      // raw-expander
      controlType = 'raw-expander';
    } else if (controlSplit[0] === 'expander') {
      // expander
      controlType = 'expander';
    } else if (!isNaN(controlSplit[1])) {
      // input
      controlType = 'input';
    } else {
      // main, misc, preset
      controlType = controlSplit[0];
    }
  }

  return controlType;
}

function controlMessage(control, value) {
  var messageType = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'input';
  var messageTypes = ['input', 'main', 'misc', 'preset'],
      channelTypes = [1, 9, 10, 1],
      controlSplit = control.split(':'),
      controlName,
      inputChannel,
      type,
      cc;

  if (messageType === 'input') {
    controlName = controlSplit[0];
    inputChannel = +controlSplit[1];
  } else {
    controlName = controlSplit[1];
  }

  if (control === 'preset'.toLowerCase()) {
    type = 192;
    cc = null;
    messageType = 'preset';
  } else {
    type = 176;
    cc = messages[messageTypes.indexOf(messageType)][controlName];
  }

  var channel = messageType === 'input' ? inputChannel : channelTypes[messageTypes.indexOf(messageType)];
  type = type + channel - 1;
  var message = [type, cc, value];
  return (0, _lodash.without)(message, undefined, null);
}

exports.controlMessage = controlMessage;
exports.findControl = findControl;
exports.getControlType = getControlType;
exports.findBank = findBank;
exports.messages = messages;