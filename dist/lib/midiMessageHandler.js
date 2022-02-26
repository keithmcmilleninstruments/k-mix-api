"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = midiMessageHandler;

var _lodash = require("lodash");

var _controlMessage = require("./control-message");

var _utilities = require("./utilities");

// debug
var kmixLog = document.querySelector('#kmixlog');

function midiMessageHandler(event, device) {
  var data = event.data,
      type = data[0] & 0xf0,
      channel = data[0] & 0xf,
      control = data[1],
      bank = (0, _controlMessage.findBank)(device.banks, channel, device.options),
      port = '',
      controlName = '',
      kind = '';
  port = event.target.name; // find control; 'fader-1'

  controlName = (0, _controlMessage.findControl)(control, type, bank, device.options); // emit ':off' if 128

  if (type === 128) kind = ':off'; // send out event for controlName

  device.emit(controlName + kind, (0, _utilities.payload)(data)); // if listening for any event

  if (device.listeners('any', true)) {
    device.emit('any', (0, _utilities.anyPayload)(controlName + kind, data));
  } // debug to console


  if (device._debug) {
    var debugLog = {
      'control:': controlName,
      'port:': port,
      'portID:': event.target.id,
      'data:': data,
      'channel:': channel + 1
    };

    if (port === 'K-Mix Audio Control') {
      debugLog = (0, _lodash.omit)(debugLog, 'control:');
      debugLog['channel:'] = data[7] + 1;
    }

    console.log('Event Debug', debugLog);
  }

  if (kmixLog) kmixLog.innerHTML = controlName + '<br>from ' + port + '<br>portID ' + e.target.id + '<br>' + data + '<br>channel ' + (channel + 1);
}