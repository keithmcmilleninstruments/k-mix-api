import { describe, expect, test, vi } from 'vitest'
import { EventEmitter } from '../src/emitter.js'

describe('EventEmitter', () => {
  test('on/emit delivers the payload to handlers', () => {
    const ee = new EventEmitter()
    const fn = vi.fn()
    ee.on('x', fn)
    expect(ee.emit('x', 42)).toBe(true)
    expect(fn).toHaveBeenCalledWith(42)
  })

  test('emit with no listeners returns false', () => {
    const ee = new EventEmitter()
    expect(ee.emit('none')).toBe(false)
  })

  test('off removes a specific handler', () => {
    const ee = new EventEmitter()
    const fn = vi.fn()
    ee.on('x', fn)
    ee.off('x', fn)
    ee.emit('x', 1)
    expect(fn).not.toHaveBeenCalled()
  })

  test('once fires exactly once', () => {
    const ee = new EventEmitter()
    const fn = vi.fn()
    ee.once('x', fn)
    ee.emit('x', 1)
    ee.emit('x', 2)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('listenerCount reflects registrations', () => {
    const ee = new EventEmitter()
    expect(ee.listenerCount('x')).toBe(0)
    ee.on('x', () => {})
    expect(ee.listenerCount('x')).toBe(1)
  })

  test('listeners returns the registered handlers', () => {
    const ee = new EventEmitter()
    const fn = () => {}
    ee.on('x', fn)
    expect(ee.listeners('x')).toContain(fn)
  })

  test('off without a handler clears all listeners for the event', () => {
    const ee = new EventEmitter()
    const fn = vi.fn()
    ee.on('x', fn)
    ee.off('x')
    ee.emit('x', 1)
    expect(fn).not.toHaveBeenCalled()
  })
})
