export class SharedData {
  constructor(data) {
    this.data = data
  }

  set pointer(p) {
    this.data[0] = p.x
    this.data[1] = p.y
    this.data[2] = p.index !== undefined ? p.index : -1
  }

  get pointer() {
    return {
      x: this.data[0],
      y: this.data[1],
      index: this.data[2] !== -1 ? this.data[2] : undefined,
    }
  }

  get forceCenterX() {
    return this.data[7]
  }

  set forceCenterX(value) {
    this.data[7] = value
  }

  get forceCenterY() {
    return this.data[8]
  }

  set forceCenterY(value) {
    this.data[8] = value
  }

  get forceCenterStrengthMod() {
    return this.data[9]
  }

  set forceCenterStrengthMod(value) {
    this.data[9] = value
  }
}
