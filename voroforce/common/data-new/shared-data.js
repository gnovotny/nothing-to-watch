export class SharedData {
  constructor(data) {
    this.data = data
  }

  get forceCenterX() {
    return this.data[0]
  }

  set forceCenterX(value) {
    this.data[0] = value
  }

  get forceCenterY() {
    return this.data[1]
  }

  set forceCenterY(value) {
    this.data[1] = value
  }

  get forceCenterStrengthMod() {
    return this.data[2]
  }

  set forceCenterStrengthMod(value) {
    this.data[2] = value
  }
}
