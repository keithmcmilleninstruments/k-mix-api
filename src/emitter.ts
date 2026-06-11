export type EventHandler = (payload?: unknown) => void

/** Minimal typed event emitter. Replaces eventemitter3. */
export class EventEmitter {
  private readonly handlers = new Map<string, Set<EventHandler>>()

  on(event: string, handler: EventHandler): this {
    const set = this.handlers.get(event) ?? new Set<EventHandler>()
    set.add(handler)
    this.handlers.set(event, set)
    return this
  }

  once(event: string, handler: EventHandler): this {
    const wrapper: EventHandler = (payload) => {
      this.off(event, wrapper)
      handler(payload)
    }
    return this.on(event, wrapper)
  }

  off(event: string, handler?: EventHandler): this {
    if (!handler) {
      this.handlers.delete(event)
      return this
    }
    this.handlers.get(event)?.delete(handler)
    return this
  }

  emit(event: string, payload?: unknown): boolean {
    const set = this.handlers.get(event)
    if (!set || set.size === 0) return false
    for (const handler of [...set]) handler(payload)
    return true
  }

  listenerCount(event: string): number {
    return this.handlers.get(event)?.size ?? 0
  }

  listeners(event: string): EventHandler[] {
    return [...(this.handlers.get(event) ?? [])]
  }
}
