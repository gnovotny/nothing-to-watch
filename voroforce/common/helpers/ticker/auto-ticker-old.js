import { CustomEventTarget } from '../../../utils/custom-event-target'
import { TickEvent } from './utils'

export class AutoTicker extends CustomEventTarget {
  initiated = false
  constructor(fpsGraph, fpsCap = 60) {
    super()
    this.fpsGraph = fpsGraph
    this.elapsed = 0
    this.delta = 16
    this.tick = this.tick.bind(this)

    this.fpsCap = fpsCap
    this.frameInterval = 1000 / this.fpsCap // milliseconds per frame
    this.lastFrameTime = 0
    this.current = 0
  }

  init() {
    this.initiated = true
    this.lastFrameTime = performance.now()
    this.current = this.lastFrameTime
  }

  start() {
    if (this.running) return
    this.running = true
    this.init()
    requestAnimationFrame(this.tick)
  }

  stop() {
    this.running = false
  }

  tick() {
    if (!this.running) return

    requestAnimationFrame(this.tick)

    // update metrics
    const currentTime = performance.now()
    this.delta = currentTime - this.current
    this.current = currentTime
    this.elapsed = this.current - this.lastFrameTime

    // console.log('this.elapsed', this.elapsed)

    // Only execute if enough time has passed for our target FPS
    if (this.elapsed >= this.frameInterval) {
      this.fpsGraph?.begin()

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

      this.fpsGraph?.end()
    }
  }

  freeze() {
    this.stop()
  }

  unfreeze() {
    this.start()
  }
}
