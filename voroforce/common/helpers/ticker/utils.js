export class TickEvent extends Event {
  constructor({ current, elapsed, delta }) {
    super('tick')
    this.current = current
    this.elapsed = elapsed
    this.delta = delta
  }
}
