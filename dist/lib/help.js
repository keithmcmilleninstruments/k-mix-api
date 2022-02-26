(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "lodash", "./control-message"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("lodash"), require("./control-message"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.lodash, global.controlMessage);
    global.help = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _lodash, _controlMessage) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = help;
  _exports.helpObject = helpObject;

  // vendor
  // modules
  function helpObject(obj, message = 'control') {
    return Object.keys(obj).map(function (key) {
      return {
        [message]: key,
        CC: obj[key]
      };
    });
  }

  function help(options, request) {
    switch (request) {
      case 'input':
        console.log('\nhelp:input');
        console.table(helpObject(_controlMessage.messages[0], 'control: per-channel 1 -8'));
        break;

      case 'main':
        console.log('\nhelp:main');
        console.table(helpObject(_controlMessage.messages[1], 'control: channel 9 (auto)'));
        break;

      case 'misc':
        console.log('\nhelp:misc');
        console.table(helpObject(_controlMessage.messages[2], 'control: channel 10 (auto)'));
        break;

      case 'control':
        console.log('\nhelp:control. What channels are assigned to each control/bank, Editor MIDI tab');
        console.table((0, _lodash.omit)(options, 'midi-channels')); // omit type

        break;
    }
  }
});