(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.deviceData = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  /*
  'device' : {
  	'devicePort': {
  		'name': 'Display Name'
  	},
  	'icon': 'https://files.keithmcmillen.com/products/k-mix/icons/k-mix.svg',
  	'manufacturer': 'Keith McMillen Instruments'
  }
  */
  var _default = {
    'k-mix': {
      'k-mix-audio-control': {
        'name': 'K-Mix Audio Control'
      },
      'k-mix-control-surface': {
        'name': 'K-Mix Control Surface'
      },
      'k-mix-expander': {
        'name': 'K-Mix Expander'
      },
      'icon': 'https://files.keithmcmillen.com/products/k-mix/icons/k-mix.svg',
      'manufacturer': 'keith-mcmillen-instruments'
    }
  };
  _exports.default = _default;
});