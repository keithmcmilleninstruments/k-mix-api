import camelcase from 'camelcase'

function stateChangeHandler(event, device) {
  const { name, type, state } = event.port
  let portName = 'error'

  if(!name.includes(device.deviceName)) return

  if(device._debug === 'state') console.log('>> K-Mix State', event.port)

  const cleanName = camelcase(name.replace('K-Mix ',''))
  
  // ignore HUI
  if(cleanName.includes('Hui')) return
  
  switch (name) {
    case 'K-Mix Audio Control':
      portName = cleanName

      break;
    case 'K-Mix Control Surface':
      portName = cleanName

      break;
    case 'K-Mix Expander':
      portName = cleanName

      break;
    default:
      device.emit('connectionerror')
  }

  device.connections[portName][type] = state === 'connected' ? true : false

  // connected
  if(Object.values(device.connections).every(port => port.input && port.output)) {
    device.emit('connected')
  }
  // disconnected
  if(Object.values(device.connections).every(port => !port.input && !port.output)) {
    device.emit('disconnected')
  }

}

export { stateChangeHandler as default }