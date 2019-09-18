export default function stateChangeHandler(event, device) {
  if(window._debugStateChange) console.log('>> K-Mix State', event.port)
  const { name, type, state } = event.port

  switch (name) {
    case 'K-Mix Audio Control':
      if(state === 'connected') {
        device.emit('audiocontrolconnected', type)
      } else {
        device.emit('audiocontroldisconnected', type)
      }
      break;
    case 'K-Mix Control Surface':
      if(state === 'connected') {
        device.emit('controlsurfaceconnected', type)
      } else {
        device.emit('controlsurfacedisconnected', type)
      }
      break;
    case 'K-Mix Expander':
      if(state === 'connected') {
        device.emit('expanderconnected', type)
      } else {
        device.emit('expanderdisconnected', type)
      }
      break;
    default:

  }
}
