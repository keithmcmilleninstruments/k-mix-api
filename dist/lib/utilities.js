(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "camelcase", "lodash"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("camelcase"), require("lodash"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.camelcase, global.lodash);
    global.utilities = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _camelcase, _lodash) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.anyPayload = anyPayload;
  _exports.arraysToObject = arraysToObject;
  _exports.convertOptions = convertOptions;
  _exports.convertRange = convertRange;
  _exports.format = format;
  _exports.isEqual = isEqual;
  _exports.payload = payload;
  _exports.storePortConnections = storePortConnections;
  _camelcase = _interopRequireDefault(_camelcase);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  function isEqual(a, b) {
    return a === b;
  }

  function format(string) {
    return string.toLowerCase().replace(/\s/g, '-').replace(',', '');
  }

  function convertOptions(user, names) {
    var newOptions = {};

    for (var o in user) {
      if (o === 'midi-channels' || !(0, _lodash.isArray)(user[o])) {
        newOptions[o] = user[o];
      } else {
        newOptions[o] = arraysToObject(user[o], names);
      }
    }

    return newOptions;
  }

  function arraysToObject(values, names) {
    return (0, _lodash.zipObject)(names, values);
  }

  function convertRange(value, r1, r2) {
    return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
  }

  function payload(data) {
    var value = data[2];
    return {
      value: value,
      raw: data
    };
  }

  function anyPayload(control, data) {
    var value = data[2];
    return {
      control: control,
      value: value,
      raw: data
    };
  } // device connection and port storing


  function storePortConnections(port, device) {
    var name = port.name,
        type = port.type,
        state = port.state;
    if (!name.includes(device.deviceName)) return;
    var cleanName = (0, _camelcase.default)(name.replace("".concat(device.deviceName, " "), ''));
    device.connections[cleanName][type] = state === 'connected' ? true : false;
    device[cleanName][type] = port;
  }
});