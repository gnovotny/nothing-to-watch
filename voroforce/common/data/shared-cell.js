import { isNumber } from '../../utils'

/**
 * Since vx, vy are currently only used in a single location (single-threaded force step),
 * they are stored locally (attr read/writes to typed array are commented out) in order to (potentially)
 * improve perf. by reducing getter/setter calls and implicit type conversions during force computations
 */
export class SharedCell {
  subgrid
  subgridIndex

  constructor(
    cellData,
    cellCoordsArray,
    cellAttributesArray,
    cellWeightsArray,
    cellMediaVersionsArray,
    cellIdsArray,
  ) {
    this.cellCoordsArray = cellCoordsArray
    this.cellAttributesArray = cellAttributesArray
    this.cellWeightsArray = cellWeightsArray
    this.cellMediaVersionsArray = cellMediaVersionsArray
    this.cellIdsArray = cellIdsArray

    // this.id = cellData.id
    this.index = cellData.index
    this.group = cellData.group

    this.cellCoordsBaseOffset = 2 * this.index
    this.cellAttributesBaseOffset = 10 * this.index

    this.xIndex = this.cellCoordsBaseOffset + 0
    this.yIndex = this.cellCoordsBaseOffset + 1

    this.vxIndex = this.cellAttributesBaseOffset + 0
    this.vyIndex = this.cellAttributesBaseOffset + 1
    this.fxIndex = this.cellAttributesBaseOffset + 2
    this.fyIndex = this.cellAttributesBaseOffset + 3
    this.targetFxIndex = this.cellAttributesBaseOffset + 4
    this.targetFyIndex = this.cellAttributesBaseOffset + 5
    this.ixIndex = this.cellAttributesBaseOffset + 6
    this.iyIndex = this.cellAttributesBaseOffset + 7
    this.rowIndex = this.cellAttributesBaseOffset + 8
    this.colIndex = this.cellAttributesBaseOffset + 9

    this.mediaVersionIndex = 2 * this.index
    this.targetMediaVersionIndex = 2 * this.index + 1
    this.weightIndex = this.index
    this.idIndex = this.index

    this.initialVx = 0
    this.initialVy = 0

    this.vx = 0
    this.vy = 0
    this.localX = 0
    this.localY = 0
    this.localIx = 0
    this.localIy = 0
    this.localWeight = 0
    this.localCol = 0
    this.localRow = 0
  }

  set x(v) {
    this.cellCoordsArray[this.xIndex] = v
  }

  get x() {
    return this.cellCoordsArray[this.xIndex]
  }

  set y(v) {
    this.cellCoordsArray[this.yIndex] = v
  }

  get y() {
    return this.cellCoordsArray[this.yIndex]
  }

  // set vx(v) {
  //   this.cellAttributesArray[this.vxIndex] = v
  // }
  //
  // get vx() {
  //   return this.cellAttributesArray[this.vxIndex]
  // }
  //
  // set vy(v) {
  //   this.cellAttributesArray[this.vyIndex] = v
  // }
  //
  // get vy() {
  //   return this.cellAttributesArray[this.vyIndex]
  // }

  set fx(v) {
    this.cellAttributesArray[this.fxIndex] = isNumber(v) ? v : 0
  }

  get fx() {
    const v = this.cellAttributesArray[this.fxIndex]
    if (v === 0) return undefined
    return v
  }

  set fy(v) {
    this.cellAttributesArray[this.fyIndex] = isNumber(v) ? v : 0
  }

  get fy() {
    const v = this.cellAttributesArray[this.fyIndex]
    if (v === 0) return undefined
    return v
  }

  set targetFx(v) {
    this.cellAttributesArray[this.targetFxIndex] = isNumber(v) ? v : 0
  }

  get targetFx() {
    const v = this.cellAttributesArray[this.targetFxIndex]
    if (v === 0) return undefined
    return v
  }

  set targetFy(v) {
    this.cellAttributesArray[this.targetFyIndex] = isNumber(v) ? v : 0
  }

  get targetFy() {
    const v = this.cellAttributesArray[this.targetFyIndex]
    if (v === 0) return undefined
    return v
  }

  set ix(v) {
    this.cellAttributesArray[this.ixIndex] = v
  }

  get ix() {
    return this.cellAttributesArray[this.ixIndex]
  }

  set iy(v) {
    this.cellAttributesArray[this.iyIndex] = v
  }

  get iy() {
    return this.cellAttributesArray[this.iyIndex]
  }

  set row(v) {
    this.cellAttributesArray[this.rowIndex] = v
  }

  get row() {
    return this.cellAttributesArray[this.rowIndex]
  }

  set col(v) {
    this.cellAttributesArray[this.colIndex] = v
  }

  get col() {
    return this.cellAttributesArray[this.colIndex]
  }

  set mediaVersion(v) {
    this.cellMediaVersionsArray[this.mediaVersionIndex] = v
  }

  get mediaVersion() {
    return this.cellMediaVersionsArray[this.mediaVersionIndex]
  }

  set targetMediaVersion(v) {
    this.cellMediaVersionsArray[this.targetMediaVersionIndex] = v
  }

  get targetMediaVersion() {
    return this.cellMediaVersionsArray[this.targetMediaVersionIndex]
  }

  set weight(v) {
    this.cellWeightsArray[this.weightIndex] = v
  }

  get weight() {
    return this.cellWeightsArray[this.weightIndex]
  }

  set id(v) {
    this.cellIdsArray[this.idIndex] = v
  }

  get id() {
    return this.cellIdsArray[this.idIndex]
  }
}
