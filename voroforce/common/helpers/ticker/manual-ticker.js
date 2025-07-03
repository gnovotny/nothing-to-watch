import { CustomEventTarget } from '../../../utils/custom-event-target'
import { TickEvent } from './utils'

export class ManualTicker extends CustomEventTarget {
  nextRequests = 0
  totalPausedTime = 0
  pauseStart = 0
  running = false
  constructor(fpsGraph) {
    super()
    this.fpsGraph = fpsGraph
    this.lastFrameTime = performance.now()
    this.current = this.lastFrameTime
    this.pauseStart = this.lastFrameTime
    this.elapsed = 0
    this.delta = 16
    this.tick = this.tick.bind(this)
  }

  start() {
    if (this.killed) return
    if (this.running) return
    this.running = true

    if (this.pauseStart) {
      this.totalPausedTime += performance.now() - this.pauseStart
    }

    requestAnimationFrame(this.tick)
  }

  stop() {
    this.running = false
    this.pauseStart = performance.now()
  }

  kill() {
    this.killed = true
  }

  tick() {
    this.nextRequests = 0
    this.fpsGraph?.end()
    this.fpsGraph?.begin()

    // update metrics
    const currentTime = performance.now()
    this.delta = currentTime - this.current
    this.current = currentTime
    this.elapsed = this.current - this.lastFrameTime - this.totalPausedTime

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
    if (!this.running) return
    this.nextRequests++
    if (this.nextRequests !== 2) return
    // this.fpsGraph?.end()
    requestAnimationFrame(this.tick)
  }

  freeze() {
    this.stop()
  }

  unfreeze() {
    this.start()
  }
}
