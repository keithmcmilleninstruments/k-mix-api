"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _eventemitter = _interopRequireDefault(require("eventemitter3"));

var _lodash = require("lodash");

var _midiPorts = _interopRequireDefault(require("midi-ports"));

var _utilities = require("./lib/utilities");

var _deviceData = _interopRequireDefault(require("./lib/device-data"));

var _kmixDefaults = _interopRequireDefault(require("./lib/kmix-defaults"));

var _midiMessageHandler = _interopRequireDefault(require("./lib/midiMessageHandler"));

var _stateChangeHandler = _interopRequireDefault(require("./lib/stateChangeHandler"));

var _controlMessageFromOptions = _interopRequireDefault(require("./lib/control-message-from-options"));

var _controlMessage = _interopRequireWildcard(require("./lib/control-message"));

var _help = _interopRequireDefault(require("./lib/help"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

let device = 'k-mix',
    options = {},
    ports = ['k-mix-audio-control', 'k-mix-control-surface', 'k-mix-expander'],
    names = ['bank_1', 'bank_2', 'bank_3', 'mode'];

class KMIX extends _eventemitter.default {
  constructor(midi, userOptions = {}, debug = false) {
    super();

    _defineProperty(this, "isConnected", (port = 'all') => {
      switch (port) {
        case 'all':
          return Object.values(this.connections).every(port => port.input && port.output);

        case 'audio-control':
          return Object.values(this.connections).every(port => {
            if (port !== 'audioControl') return;
            return port.input && port.output;
          });

        case 'control-surface':
          return Object.values(this.connections).every(port => {
            if (port !== 'controlSurface') return;
            return port.input && port.output;
          });

        case 'expander':
          return Object.values(this.connections).every(port => {
            if (port !== 'expander') return;
            return port.input && port.output;
          });

        default:
          return false;
      }
    });

    _defineProperty(this, "help", (() => (0, _lodash.partial)(_help.default, options))());

    this.deviceName = 'K-Mix';
    this._debug = debug; // store port connection status

    this.connections = {
      audioControl: {
        input: false,
        output: false
      },
      controlSurface: {
        input: false,
        output: false
      },
      expander: {
        input: false,
        output: false
      }
    };
    this.audioControl = {
      input: null,
      output: null
    };
    this.controlSurface = {
      input: null,
      output: null
    };
    this.expander = {
      input: null,
      output: null
    };
    this.midi = midi; // set statechange handler

    this.midi.onstatechange = e => (0, _stateChangeHandler.default)(e, this);

    this.banks = (0, _lodash.initial)(names);
    let newOptions = (0, _utilities.convertOptions)(userOptions, names); // make options

    this.options = (0, _lodash.merge)(_kmixDefaults.default, newOptions); // make devices object

    this.devices = (0, _midiPorts.default)(this.midi, _deviceData.default); // store ports and connecitons

    this.midi.inputs.forEach(input => (0, _utilities.storePortConnections)(input, this));
    this.midi.outputs.forEach(output => (0, _utilities.storePortConnections)(output, this));
    if (!this.controlSurface.input) return; // set main ports

    this.input = this.controlSurface.input;
    this.output = this.audioControl.output; // debug

    if (this._debug) {
      this.inputDebug = this.audioControl.input;

      this.inputDebug.onmidimessage = e => {
        // add formatted console logging
        (0, _midiMessageHandler.default)(e, this);
      };
    } else {
      // set event handler
      this.input.onmidimessage = e => {
        // add formatted console logging
        (0, _midiMessageHandler.default)(e, this);
      };
    }
  }

  send(control, value, bank = 1, time = 0) {
    let output,
        message,
        sendTime,
        port = ports[0],
        controlType = (0, _controlMessage.getControlType)(control);
    sendTime = time;

    switch (controlType) {
      case 'raw':
        // raw : send([176,1,127], time)
        message = control;
        time = value || 0;
        port = ports[0];
        break;

      case 'raw-control':
        // raw-control : send('control',[176,1,127], time)
        message = value;
        port = ports[1];
        break;

      case 'control':
        // to control-surface : send('control:button-vu',0), send('control:fader-1', 64)
        port = ports[1];
        control = control.split(':')[1];
        message = (0, _controlMessageFromOptions.default)(control, value, bank, options);
        break;

      case 'raw-expander':
        port = ports[2];
        control = control.split(':')[1];
        message = value;

      case 'expander':
        port = ports[2];
        control = control.split(':')[1];
        message = value;

      default:
        // 'input', 'main', 'misc', 'preset'
        // to audio control : send('fader:1', value, time)
        message = (0, _controlMessage.default)(control, value, controlType);
        break;
    }

    if (message.length < 3 && controlType !== 'preset') {
      console.warn('>> K-Mix: Please check control name');
    } else {
      this.output.send(message, window.performance.now() + sendTime);
    }
  }

}

exports.default = KMIX;