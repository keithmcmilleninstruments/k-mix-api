(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "camelcase"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("camelcase"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.camelcase);
    global.stateChangeHandler = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _camelcase) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = stateChangeHandler;
  _camelcase = _interopRequireDefault(_camelcase);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  function stateChangeHandler(event, device) {
    const {
      name,
      type,
      state
    } = event.port;
    let portName = 'error';
    if (!name.includes(device.deviceName)) return;
    if (window._debugStateChange) console.log('>> K-Mix State', event.port);
    const cleanName = (0, _camelcase.default)(name.replace('K-Mix ', ''));

    switch (name) {
      case 'K-Mix Audio Control':
        portName = cleanName;
        break;

      case 'K-Mix Control Surface':
        portName = cleanName;
        break;

      case 'K-Mix Expander':
        portName = cleanName;
        break;

      default:
        device.emit('connectionerror');
    }

    device.connections[portName][type] = state === 'connected' ? true : false; // connected

    if (Object.values(device.connections).every(port => port.input && port.output)) {
      device.emit('connected');
    } // disconnected


    if (Object.values(device.connections).every(port => !port.input && !port.output)) {
      device.emit('disconnected');
    }
  }
});