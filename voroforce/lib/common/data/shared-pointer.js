export class SharedPointer {
  constructor(data) {
    this.data = data
  }

  get x() {
    return this.data[0] !== -1 ? this.data[0] : undefined
  }

  set x(value) {
    this.data[0] = value !== undefined ? value : -1
  }

  get y() {
    return this.data[1] !== -1 ? this.data[1] : undefined
  }

  set y(value) {
    this.data[1] = value !== undefined ? value : -1
  }

  get index() {
    return this.data[2] !== -1 ? this.data[2] : undefined
  }

  set index(value) {
    this.data[2] = value !== undefined ? value : -1
  }
}
