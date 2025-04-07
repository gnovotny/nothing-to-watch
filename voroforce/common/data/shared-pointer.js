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

  get indices() {
    return [
      this.data[2] !== -1 ? this.data[2] : undefined,
      this.data[3] !== -1 ? this.data[3] : undefined,
      this.data[4] !== -1 ? this.data[4] : undefined,
      this.data[5] !== -1 ? this.data[5] : undefined,
    ]
  }

  set indices(value) {
    this.data[2] = value?.[0] !== undefined ? value[0] : -1
    this.data[3] = value?.[1] !== undefined ? value[1] : -1
    this.data[4] = value?.[2] !== undefined ? value[2] : -1
    this.data[5] = value?.[3] !== undefined ? value[3] : -1
  }

  get speedScale() {
    return this.data[6]
  }

  set speedScale(value) {
    this.data[6] = value
  }
}
