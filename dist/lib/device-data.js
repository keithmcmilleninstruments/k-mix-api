(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof exports !== "undefined") {
    factory();
  } else {
    var mod = {
      exports: {}
    };
    factory();
    global.deviceData = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /*
  'device' : {
  	'devicePort': {
  		'name': 'Display Name'
  	},
  	'icon': 'https://files.keithmcmillen.com/products/k-mix/icons/k-mix.svg',
  	'manufacturer': 'Keith McMillen Instruments'
  }
  */
  var deviceData = {
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
  module.exports = deviceData;
});