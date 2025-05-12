import { CustomEventTarget } from '../../../utils/custom-event-target'
import { TickEvent } from './utils'

export class ManualTicker extends CustomEventTarget {
  nextRequests = 0
  frozen = false
  constructor(fpsGraph) {
    super()
    this.fpsGraph = fpsGraph
    this.lastFrameTime = performance.now()
    this.current = this.lastFrameTime
    this.elapsed = 0
    this.delta = 16
    this.tick = this.tick.bind(this)
  }

  start() {
    requestAnimationFrame(this.tick)
  }

  tick() {
    this.nextRequests = 0
    this.fpsGraph?.begin()

    // update metrics
    const currentTime = performance.now()
    this.delta = currentTime - this.current
    this.current = currentTime
    this.elapsed = this.current - this.lastFrameTime

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
    this.nextRequests++
    if (this.nextRequests !== 2) return
    this.fpsGraph?.end()
    requestAnimationFrame(this.tick)
  }

  freeze() {
    this.frozen = true
  }

  unfreeze() {
    this.frozen = false
    this.ticker.next()
  }
}
