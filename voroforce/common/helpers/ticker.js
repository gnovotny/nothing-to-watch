import { CustomEventTarget } from '../../utils/custom-event-target'

class TickEvent extends Event {
  constructor({ current, elapsed, delta }) {
    super('tick')
    this.current = current
    this.elapsed = elapsed
    this.delta = delta
  }
}

export class Ticker extends CustomEventTarget {
  nextRequested = false
  frozen = false
  initiated = false
  constructor(fps = 60) {
    super()
    this.elapsed = 0
    this.delta = 16
    this.tick = this.tick.bind(this)

    this.fps = fps
    this.frameInterval = 1000 / this.fps // milliseconds per frame
    this.lastFrameTime = 0
    this.current = 0
  }

  init() {
    this.initiated = true
    this.lastFrameTime = performance.now() - 17
    this.current = this.lastFrameTime
  }

  start() {
    if (this.running) return
    this.running = true
    this.init()
    this.tick()
  }

  stop() {
    this.running = false
  }

  // todo https://claude.ai/chat/5abf6755-34d5-4790-8932-d34981a1e9c1
  tick() {
    if (!this.running) return

    this.nextRequested = false

    requestAnimationFrame(this.tick)

    // update metrics

    // const currentTime = Date.now()
    const currentTime = performance.now()
    this.delta = currentTime - this.current
    this.current = currentTime
    this.elapsed = this.current - this.lastFrameTime

    // console.log('this.elapsed', this.elapsed)
    // console.log('this.frameInterval', this.frameInterval)

    // Only execute if enough time has passed for our target FPS
    if (this.elapsed >= this.frameInterval) {
      // Adjust lastFrameTime to maintain consistent timing
      // This prevents time drift by accounting for actual elapsed time
      this.lastFrameTime = currentTime - (this.elapsed % this.frameInterval)

      // trigger event
      this.dispatchEvent(
        new TickEvent({
          delta: this.delta,
          current: this.current,
          elapsed: this.elapsed,
        }),
      )
    }
  }

  next() {
    if (this.frozen) return
    if (this.nextRequested) return
    this.nextRequested = true
    if (!this.initiated) this.init()
    requestAnimationFrame(this.tick)
  }

  freeze() {
    this.frozen = true
  }

  unfreeze() {
    this.init()
    this.frozen = false
  }
}
