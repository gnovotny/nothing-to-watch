export class PointerMoveEvent extends Event {
  constructor(pointer) {
    super('pointerMove')
    this.pointer = pointer
  }
}

export class PointerShakeEvent extends Event {
  constructor(data) {
    super('pointerShake')
    Object.assign(this, data)
  }
}

export class PointerFrozenChangeEvent extends Event {
  constructor(data) {
    super('pointerFrozenChange')
    Object.assign(this, data)
  }
}

export class CellFocusedEvent extends Event {
  constructor(cell, cells) {
    super('focused')
    this.cell = cell
    this.cells = cells
  }
}

export class CellSelectedEvent extends Event {
  constructor(cell, cells) {
    super('selected')
    this.cell = cell
    this.cells = cells
  }
}
