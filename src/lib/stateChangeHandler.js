export default function stateChangeHandler(event, device) {
  const { name, type, state } = event.port
  let portName = 'error'

  if(!name.includes(device.deviceName)) return

  if(window._debugStateChange) console.log('>> K-Mix State', event.port)

  switch (name) {
    case 'K-Mix Audio Control':
      portName = 'audioControl'

      break;
    case 'K-Mix Control Surface':
      portName = 'controlSurface'

      break;
    case 'K-Mix Expander':
      portName = 'expander'

      break;
    default:
      device.emit('connectionerror')
  }

  device.connections[portName][type] = state === 'connected' ? true : false

  // connected
  if(Object.values(device.connections).every(p => p.input && p.output)) {
    device.emit('connected')
  }
  // disconnected
  if(Object.values(device.connections).every(p => !p.input && !p.output)) {
    device.emit('disconnected')
  }

}
