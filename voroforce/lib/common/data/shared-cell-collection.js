export default class SharedCellCollection extends Array {
  constructor() {
    super()
    this.focusedArrayIndex = 0
    this.selectedArrayIndex = 1
    this.draggingArrayIndex = 2
  }

  static from(arr, cellCollectionData) {
    // biome-ignore lint/complexity/noThisInStatic: <explanation>
    const c = super.from(arr)
    c.cellCollectionData = cellCollectionData
    return c
  }

  set focused(n) {
    this.cellCollectionData[this.focusedArrayIndex] =
      n?.index !== undefined ? n.index : -1
  }

  get focused() {
    return this[this.cellCollectionData[this.focusedArrayIndex]]
  }

  set focusedIndex(i) {
    this.cellCollectionData[this.focusedArrayIndex] = i !== undefined ? i : -1
  }

  get focusedIndex() {
    return this.cellCollectionData[this.focusedArrayIndex]
  }

  set selected(n) {
    this.cellCollectionData[this.selectedArrayIndex] =
      n?.index !== undefined ? n.index : -1
  }

  get selected() {
    return this[this.cellCollectionData[this.selectedArrayIndex]]
  }

  set selectedIndex(i) {
    this.cellCollectionData[this.selectedArrayIndex] = i !== undefined ? i : -1
  }

  get selectedIndex() {
    return this.cellCollectionData[this.selectedArrayIndex]
  }

  set dragging(n) {
    this.cellCollectionData[this.draggingArrayIndex] = n?.index ?? -1
  }

  get dragging() {
    return this[this.cellCollectionData[this.draggingArrayIndex]]
  }
}
