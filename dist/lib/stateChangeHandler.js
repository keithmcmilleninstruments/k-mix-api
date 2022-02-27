import camelcase from 'camelcase';

function stateChangeHandler(event, device) {
  var _event$port = event.port,
      name = _event$port.name,
      type = _event$port.type,
      state = _event$port.state;
  var portName = 'error';
  if (!name.includes(device.deviceName)) return;
  if (window._debugStateChange) console.log('>> K-Mix State', event.port);
  var cleanName = camelcase(name.replace('K-Mix ', ''));

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

  if (Object.values(device.connections).every(function (port) {
    return port.input && port.output;
  })) {
    device.emit('connected');
  } // disconnected


  if (Object.values(device.connections).every(function (port) {
    return !port.input && !port.output;
  })) {
    device.emit('disconnected');
  }
}

module.exports = stateChangeHandler;