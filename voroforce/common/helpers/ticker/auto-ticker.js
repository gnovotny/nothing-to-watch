import { CustomEventTarget } from '../../../utils/custom-event-target'
import { TickEvent } from './utils'

export class AutoTicker extends CustomEventTarget {
  constructor(fpsGraph, fpsCap = 60) {
    super()
    this.fpsGraph = fpsGraph
    this.elapsed = 0
    this.delta = 16
    this.tick = this.tick.bind(this)

    this.fpsCap = fpsCap
    this.frameInterval = 1000 / this.fpsCap // milliseconds per frame
    this.current = this.initialFrameTime = this.lastFrameTime = 0
  }

  init() {
    this.current =
      this.initialFrameTime =
      this.lastFrameTime =
        performance.now()
  }

  start() {
    if (this.killed) return
    if (this.running) return
    this.running = true
    this.init()
    requestAnimationFrame(this.tick)
  }

  stop() {
    this.running = false
  }

  kill() {
    this.killed = true
  }

  tick() {
    if (!this.running) return
    this.fpsGraph?.end()
    this.fpsGraph?.begin()

    requestAnimationFrame(this.tick)

    // update metrics
    const currentTime = performance.now()
    this.delta = currentTime - this.current

    // console.log('this.delta', this.delta)
    // const elapsedSinceLastFrame = currentTime - this.lastFrameTime

    // console.log('this.elapsed', this.elapsed)

    // Only execute if enough time has passed for our target FPS
    // if (elapsedSinceLastFrame >= this.frameInterval) {
    if (this.delta >= this.frameInterval) {
      // this.fpsGraph?.begin()

      this.current = currentTime - (this.delta % this.frameInterval)
      this.elapsed = this.current - this.initialFrameTime

      // Adjust lastFrameTime to maintain consistent timing
      // This prevents time drift by accounting for actual elapsed time
      // this.lastFrameTime =
      //   currentTime - (elapsedSinceLastFrame % this.frameInterval)

      // trigger event
      this.dispatchEvent(
        new TickEvent({
          delta: this.delta,
          current: this.current,
          elapsed: this.elapsed,
        }),
      )

      // this.fpsGraph?.end()
    }
  }

  freeze() {
    this.stop()
  }

  unfreeze() {
    this.start()
  }
}
