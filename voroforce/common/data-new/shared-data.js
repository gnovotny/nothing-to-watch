export class SharedData {
  constructor(data) {
    this.data = data
  }

  get centerForceX() {
    return this.data[0]
  }

  set centerForceX(value) {
    this.data[0] = value
  }

  get centerForceY() {
    return this.data[1]
  }

  set centerForceY(value) {
    this.data[1] = value
  }

  get centerForceStrengthMod() {
    return this.data[2]
  }

  set centerForceStrengthMod(value) {
    this.data[2] = value
  }
}
