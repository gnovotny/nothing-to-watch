class TickEvent extends Event {
  constructor({ current, elapsed, delta }) {
    super('tick')
    this.current = current
    this.elapsed = elapsed
    this.delta = delta
  }
}

export class Ticker extends EventTarget {
  nextRequested = false
  frozen = false
  constructor() {
    super()
    this.start = Date.now()
    this.current = this.start
    this.elapsed = 0
    this.delta = 16
    this.tick = this.tick.bind(this)
  }

  tick() {
    this.nextRequested = false

    // update metrics
    const currentTime = Date.now()
    this.delta = currentTime - this.current
    this.current = currentTime
    this.elapsed = this.current - this.start

    // trigger event
    this.dispatchEvent(
      new TickEvent({
        delta: this.delta,
        current: this.current,
        elapsed: this.elapsed,
      }),
    )
  }

  next() {
    if (this.frozen) return
    if (this.nextRequested) return
    this.nextRequested = true
    requestAnimationFrame(this.tick)
  }

  freeze() {
    this.frozen = true
  }

  unfreeze() {
    this.frozen = false
  }
}
