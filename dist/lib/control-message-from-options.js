(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "lodash"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("lodash"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.lodash);
    global.controlMessageFromOptions = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _lodash) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = controlMessageFromOptions;

  // vendor
  function controlMessageFromOptions(control, value, bank, options) {
    var banks = ['bank_1', 'bank_2', 'bank_3'],
        channel = options['midi-channels'][bank - 1],
        cc = options[control][banks[bank - 1]],
        type = 0;

    if (control.includes('fader') || control.includes('rotary')) {
      type = 176;
    } else {
      if (value === 0) {
        type = 128;
      } else {
        type = 144;
        value = 127;
      }
    }

    type = type + channel - 1;
    if (!type) throw new Error('Check control name');
    var message = [type, cc, value];
    return (0, _lodash.without)(message, undefined, null);
  }
});