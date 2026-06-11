/**
 * Vitest global setup: ensure `globalThis.navigator` is a configurable,
 * writable property so tests can assign fakes via `globalThis.navigator = …`.
 */
const navDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
if (navDescriptor && !navDescriptor.writable && !navDescriptor.set) {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    writable: true,
    value: navDescriptor.get ? navDescriptor.get.call(globalThis) : navDescriptor.value,
  })
}
