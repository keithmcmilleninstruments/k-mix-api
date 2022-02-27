(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["mitt", "lodash", "midi-ports", "./lib/utilities", "./lib/device-data", "./lib/kmix-defaults", "./lib/midiMessageHandler", "./lib/stateChangeHandler", "./lib/control-message-from-options", "./lib/control-message", "./lib/help"], factory);
  } else if (typeof exports !== "undefined") {
    factory(require("mitt"), require("lodash"), require("midi-ports"), require("./lib/utilities"), require("./lib/device-data"), require("./lib/kmix-defaults"), require("./lib/midiMessageHandler"), require("./lib/stateChangeHandler"), require("./lib/control-message-from-options"), require("./lib/control-message"), require("./lib/help"));
  } else {
    var mod = {
      exports: {}
    };
    factory(global.mitt, global.lodash, global.midiPorts, global.utilities, global.deviceData, global.kmixDefaults, global.midiMessageHandler, global.stateChangeHandler, global.controlMessageFromOptions, global.controlMessage, global.help);
    global.kmixapi = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_mitt, _lodash, _midiPorts, _utilities, _deviceData, _kmixDefaults, _midiMessageHandler, _stateChangeHandler, _controlMessageFromOptions, _controlMessage, _help) {
  "use strict";

  _mitt = _interopRequireDefault(_mitt);
  _midiPorts = _interopRequireDefault(_midiPorts);
  _deviceData = _interopRequireDefault(_deviceData);
  _kmixDefaults = _interopRequireDefault(_kmixDefaults);
  _midiMessageHandler = _interopRequireDefault(_midiMessageHandler);
  _stateChangeHandler = _interopRequireDefault(_stateChangeHandler);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
        return (0, _lodash.partial)(_help.help, options);
      }());

      // event emitter		
      this.ee = (0, _mitt.default)();
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
        return (0, _stateChangeHandler.default)(e, _this);
      });
      this.banks = (0, _lodash.initial)(names);
      var newOptions = (0, _utilities.convertOptions)(userOptions, names); // make options

      this.options = (0, _lodash.merge)(_kmixDefaults.default, newOptions); // make devices object

      this.devices = (0, _midiPorts.default)(this.midi, _deviceData.default); // store ports and connecitons

      this.midi.inputs.forEach(function (input) {
        return (0, _utilities.storePortConnections)(input, _this);
      });
      this.midi.outputs.forEach(function (output) {
        return (0, _utilities.storePortConnections)(output, _this);
      });
      if (!this.controlSurface.input) return; // set main ports

      this.input = this.controlSurface.input;
      this.output = this.audioControl.output; // debug

      if (this._debug) {
        this.inputDebug = this.audioControl.input;

        this.inputDebug.onmidimessage = function (e) {
          // add formatted console logging
          (0, _midiMessageHandler.default)(e, _this);
        };
      } else {
        // set event handler
        this.input.onmidimessage = function (e) {
          // add formatted console logging
          (0, _midiMessageHandler.default)(e, _this);
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
            message = (0, _controlMessageFromOptions.controlMessageFromOptions)(control, value, bank, options);
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
            message = (0, _controlMessage.controlMessage)(control, value, controlType);
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
});