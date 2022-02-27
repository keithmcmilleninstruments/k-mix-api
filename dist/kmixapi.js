function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import mitt from 'mitt';
import { merge, initial, partial } from "lodash"; // modules

import createDeviceList from 'midi-ports';
import { storePortConnections, convertOptions } from './lib/utilities';
import deviceData from './lib/device-data';
import kmixDefaults from "./lib/kmix-defaults";
import midiMessageHandler from "./lib/midiMessageHandler";
import stateChangeHandler from "./lib/stateChangeHandler";
import { controlMessageFromOptions } from './lib/control-message-from-options';
import { controlMessage, getControlType } from "./lib/control-message";
import { help } from "./lib/help";
var options = {},
    ports = ['k-mix-audio-control', 'k-mix-control-surface', 'k-mix-expander'],
    names = ['bank_1', 'bank_2', 'bank_3', 'mode'];

var KMIX = /*#__PURE__*/function () {
  function KMIX(midi) {
    var _this = this;

    var userOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var debug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    _classCallCheck(this, KMIX);

    _defineProperty(this, "isConnected", function () {
      var port = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'all';

      switch (port) {
        case 'all':
          return Object.values(_this.connections).every(function (port) {
            return port.input && port.output;
          });

        case 'audio-control':
          return Object.values(_this.connections).every(function (port) {
            if (port !== 'audioControl') return;
            return port.input && port.output;
          });

        case 'control-surface':
          return Object.values(_this.connections).every(function (port) {
            if (port !== 'controlSurface') return;
            return port.input && port.output;
          });

        case 'expander':
          return Object.values(_this.connections).every(function (port) {
            if (port !== 'expander') return;
            return port.input && port.output;
          });

        default:
          return false;
      }
    });

    _defineProperty(this, "help", function () {
      return partial(help, options);
    }());

    // event emitter		
    this.ee = mitt();
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

    this.midi.addEventListener('statechange', function (e) {
      return stateChangeHandler(e, _this);
    });
    this.banks = initial(names);
    var newOptions = convertOptions(userOptions, names); // make options

    this.options = merge(kmixDefaults, newOptions); // make devices object

    this.devices = createDeviceList(this.midi, deviceData); // store ports and connecitons

    this.midi.inputs.forEach(function (input) {
      return storePortConnections(input, _this);
    });
    this.midi.outputs.forEach(function (output) {
      return storePortConnections(output, _this);
    });
    if (!this.controlSurface.input) return; // set main ports

    this.input = this.controlSurface.input;
    this.output = this.audioControl.output; // debug

    if (this._debug) {
      this.inputDebug = this.audioControl.input;

      this.inputDebug.onmidimessage = function (e) {
        // add formatted console logging
        midiMessageHandler(e, _this);
      };
    } else {
      // set event handler
      this.input.onmidimessage = function (e) {
        // add formatted console logging
        midiMessageHandler(e, _this);
      };
    }
  }

  _createClass(KMIX, [{
    key: "emit",
    value: function emit(name, payload) {
      this.ee.emit(name, payload);
    }
  }, {
    key: "on",
    value: function on(name, cb) {
      this.ee.on(name, cb);
    }
  }, {
    key: "off",
    value: function off(name) {
      this.ee.off(name, cb);
    }
  }, {
    key: "send",
    value: function send(control, value) {
      var bank = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
      var time = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var message,
          sendTime,
          controlType = getControlType(control);
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
          message = controlMessageFromOptions(control, value, bank, options);
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
          message = controlMessage(control, value, controlType);
          break;
      }

      if (message.length < 3 && controlType !== 'preset') {
        console.warn('>> K-Mix: Please check control name');
      } else {
        this.output.send(message, window.performance.now() + sendTime);
      }
    }
  }]);

  return KMIX;
}();

module.exports = KMIX;