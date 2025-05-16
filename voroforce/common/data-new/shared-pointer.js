export class SharedPointer {
  constructor(data) {
    this.data = data
  }

  get rawX() {
    return this.data[0] !== -1 ? this.data[0] : undefined
  }

  set rawX(value) {
    this.data[0] = value !== undefined ? value : -1
  }

  get rawY() {
    return this.data[1] !== -1 ? this.data[1] : undefined
  }

  set rawY(value) {
    this.data[1] = value !== undefined ? value : -1
  }

  get x() {
    return this.data[2] !== -1 ? this.data[2] : undefined
  }

  set x(value) {
    this.data[2] = value !== undefined ? value : -1
  }

  get y() {
    return this.data[3] !== -1 ? this.data[3] : undefined
  }

  set y(value) {
    this.data[3] = value !== undefined ? value : -1
  }

  get index() {
    return this.data[4] !== -1 ? this.data[4] : undefined
  }

  set index(value) {
    this.data[4] = value !== undefined ? value : -1
  }

  get indices() {
    return [
      this.data[4] !== -1 ? this.data[4] : undefined,
      this.data[5] !== -1 ? this.data[5] : undefined,
      this.data[6] !== -1 ? this.data[6] : undefined,
      this.data[7] !== -1 ? this.data[7] : undefined,
    ]
  }

  set indices(value) {
    this.data[4] = value?.[4] !== undefined ? value[4] : -1
    this.data[5] = value?.[5] !== undefined ? value[5] : -1
    this.data[6] = value?.[6] !== undefined ? value[6] : -1
    this.data[7] = value?.[7] !== undefined ? value[7] : -1
  }

  get speedScale() {
    return this.data[8]
  }

  set speedScale(value) {
    this.data[8] = value
  }
}
