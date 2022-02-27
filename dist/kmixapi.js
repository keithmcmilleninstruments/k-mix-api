function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "eventemitter3", "lodash", "midi-ports", "./lib/utilities", "./lib/device-data", "./lib/kmix-defaults", "./lib/midiMessageHandler", "./lib/stateChangeHandler", "./lib/control-message-from-options", "./lib/control-message", "./lib/help"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("eventemitter3"), require("lodash"), require("midi-ports"), require("./lib/utilities"), require("./lib/device-data"), require("./lib/kmix-defaults"), require("./lib/midiMessageHandler"), require("./lib/stateChangeHandler"), require("./lib/control-message-from-options"), require("./lib/control-message"), require("./lib/help"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.eventemitter3, global.lodash, global.midiPorts, global.utilities, global.deviceData, global.kmixDefaults, global.midiMessageHandler, global.stateChangeHandler, global.controlMessageFromOptions, global.controlMessage, global.help);
    global.kmixapi = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _eventemitter, _lodash, _midiPorts, _utilities, _deviceData, _kmixDefaults, _midiMessageHandler, _stateChangeHandler, _controlMessageFromOptions, _controlMessage, _help) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  _eventemitter = _interopRequireDefault(_eventemitter);
  _midiPorts = _interopRequireDefault(_midiPorts);
  _deviceData = _interopRequireDefault(_deviceData);
  _kmixDefaults = _interopRequireDefault(_kmixDefaults);
  _midiMessageHandler = _interopRequireDefault(_midiMessageHandler);
  _stateChangeHandler = _interopRequireDefault(_stateChangeHandler);
  _controlMessageFromOptions = _interopRequireDefault(_controlMessageFromOptions);
  _controlMessage = _interopRequireWildcard(_controlMessage);
  _help = _interopRequireDefault(_help);

  function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

  function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

  function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

  function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

  function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

  function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  var options = {},
      ports = ['k-mix-audio-control', 'k-mix-control-surface', 'k-mix-expander'],
      names = ['bank_1', 'bank_2', 'bank_3', 'mode'];

  var KMIX = /*#__PURE__*/function (_EventEmitter) {
    _inherits(KMIX, _EventEmitter);

    function KMIX(midi) {
      var _this;

      var userOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var debug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      _classCallCheck(this, KMIX);

      _this = _EventEmitter.call(this) || this;

      _defineProperty(_assertThisInitialized(_this), "isConnected", function () {
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

      _defineProperty(_assertThisInitialized(_this), "help", function () {
        return (0, _lodash.partial)(_help.default, options);
      }());

      _this.deviceName = 'K-Mix';
      _this._debug = debug; // store port connection status

      _this.connections = {
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
      _this.audioControl = {
        input: null,
        output: null
      };
      _this.controlSurface = {
        input: null,
        output: null
      };
      _this.expander = {
        input: null,
        output: null
      };
      _this.midi = midi; // set statechange handler

      _this.midi.addEventListener('statechange', function (e) {
        return (0, _stateChangeHandler.default)(e, _assertThisInitialized(_this));
      });

      _this.banks = (0, _lodash.initial)(names);
      var newOptions = (0, _utilities.convertOptions)(userOptions, names); // make options

      _this.options = (0, _lodash.merge)(_kmixDefaults.default, newOptions); // make devices object

      _this.devices = (0, _midiPorts.default)(_this.midi, _deviceData.default); // store ports and connecitons

      _this.midi.inputs.forEach(function (input) {
        return (0, _utilities.storePortConnections)(input, _assertThisInitialized(_this));
      });

      _this.midi.outputs.forEach(function (output) {
        return (0, _utilities.storePortConnections)(output, _assertThisInitialized(_this));
      });

      if (!_this.controlSurface.input) return _possibleConstructorReturn(_this); // set main ports

      _this.input = _this.controlSurface.input;
      _this.output = _this.audioControl.output; // debug

      if (_this._debug) {
        _this.inputDebug = _this.audioControl.input;

        _this.inputDebug.onmidimessage = function (e) {
          // add formatted console logging
          (0, _midiMessageHandler.default)(e, _assertThisInitialized(_this));
        };
      } else {
        // set event handler
        _this.input.onmidimessage = function (e) {
          // add formatted console logging
          (0, _midiMessageHandler.default)(e, _assertThisInitialized(_this));
        };
      }

      return _this;
    }

    _createClass(KMIX, [{
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
    }]);

    return KMIX;
  }(_eventemitter.default);

  _exports.default = KMIX;
});