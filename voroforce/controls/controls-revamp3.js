import { isTouchDevice } from '../utils'
import { CustomEventTarget } from '../utils/custom-event-target'
import {
  CellFocusedEvent,
  CellSelectedEvent,
  PointerFrozenChangeEvent,
  PointerMoveEvent,
  PointerShakeEvent,
} from './controls-events'

// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional
const Infinity = Number.POSITIVE_INFINITY

const { abs, atan2, pow, sqrt, random, min, max, PI } = Math

const getAverageSpeedTotal = (array) =>
  array.reduce((a, b) => a + b.total, 0) / array.length

export default class Controls extends CustomEventTarget {
  pointerFrozen = true

  constructor(store, display, options = {}) {
    super()
    this.initGlobals(store, display)
    this.initProperties()
    this.initEventListeners()
    this.handleConfig()

    // Store previous positions and timestamps
    this.positionHistory = []
    this.speeds = []
    this.maxHistory = 10 // Number of prev items to store for calculations

    // Current values
    this.position = null
    this.lastPosition = null // Last adjusted position
    this.speed = { x: 0, y: 0, total: 0 }
    this.lastSpeed = { x: 0, y: 0, total: 0 } // Last adjusted speed
    this.avgSpeedTotal = 0
    this.acceleration = { x: 0, y: 0, total: 0 }
    this.direction = 0

    // Last timestamp for controlling position updates
    this.lastTimestamp = null
  }

  initGlobals(store, display) {
    this.store = store
    this.store.set('controls', this)
    this.globalConfig = this.store.get('config')
    this.config = this.globalConfig.controls
    this.display = display
  }

  initProperties() {
    this.container = this.store.get('container')
    this.dimensions = this.store.get('dimensions')
    this.pointer = this.store.get('sharedPointer')
    this.cells = this.store.get('cells')
  }

  handleConfig() {
    // const d = this.dimensions.get('diagonal')
    // this.maxSpeed = this.config.maxPointerSpeed
    //   ? this.config.maxPointerSpeed * d
    //   : Infinity
    // this.maxAcceleration = this.config.maxPointerAcceleration
    //   ? this.config.maxPointerAcceleration * d
    //   : Infinity

    this.options = {
      noProcessing: this.config.noProcessing || false,

      maxSpeed: this.config.maxSpeed || 10,
      minSpeed: this.config.minSpeed || 2,
      ease: this.config.ease || 0.15,
      maxAcceleration: this.config.maxAcceleration || 50000,
      capValues: this.config.capValues || false,

      freezeOnJolt: {
        enabled: this.config.freezeOnJolt?.enabled || false,
        factor: this.config.freezeOnJolt?.factor || 10,
        minSpeedValue: this.config.freezeOnJolt?.minSpeedValue || 100,
      },

      unfreezePointerSpeedLimit: this.config.unfreezePointerSpeedLimit || 300,

      freezeOnShake: {
        enabled: this.config.freezeOnShake?.enabled || false,
        minSpeed: this.config.freezeOnShake?.minSpeed || 100, // Minimum velocity to count as a shake
        dirChangeTimeout: this.config.freezeOnShake?.dirChangeTimeout || 250, // Reset after this many ms of no dir change
        minShakes: this.config.freezeOnShake?.minShakes || 3, // Minimum direction changes to trigger a shake
        cooldown: this.config.freezeOnShake?.cooldown || 2000, // Minimum time between shake events
      },
    }

    if (
      this.config.autoFocusCenter?.enabled &&
      (this.config.autoFocusCenter.enabled !== 'touch' || isTouchDevice)
    )
      this.update = this.handleAutoFocusUpdate
  }

  handleUpdate(/*position = this.position*/) {
    if (this.pointerFrozen) {
      this.getCellIndices(this.pointer, (primaryIndex, indices) => {
        this.assignPointer({
          indices,
        })
        this.focusCell(primaryIndex)
      })
    }

    this.handleRawPointerPosition()

    if (!this.position) return

    if (!this.pointerFrozen) {
      this.pointer.speedScale =
        Math.min(this.speed.total, this.options.maxSpeed) /
        this.options.maxSpeed
      this.assignPointer(this.position)
      this.handlePointerMove()
    }

    this.getCellIndices(this.position, (primaryIndex, indices) => {
      if (this.pointerFrozen) {
        if (
          this.speed.total < this.options.unfreezePointerSpeedLimit &&
          this.cells.focusedIndex === primaryIndex
        ) {
          this.unfreezePointer()
        }
      } else {
        if (this.pointerPinned && this.cells.focusedIndex !== primaryIndex) {
          this.assignPointer(this.pinnedPointer)
          this.unpinPointer()
          this.freezePointer()
        } else {
          this.assignPointer({
            indices,
          })
          this.focusCell(primaryIndex)
        }
      }
    })
  }

  handleRawPointerPosition() {
    if (!this.rawPosition) return

    if (this.options.noProcessing) {
      this.position = { x: this.rawPosition.x, y: this.rawPosition.y }
      return
    }

    const timestamp = performance.now()

    // Process the position with capping if needed
    const position = this.processPosition(this.rawPosition, timestamp)

    // Update current position
    this.position = { x: position.x, y: position.y }

    // Add current position to our array
    this.positionHistory.push(position)
    // Keep array at max size
    if (this.positionHistory.length > this.maxHistory) {
      this.positionHistory.shift()
    }

    // Add current position to our array
    this.speeds.push({
      ...this.speed,
    })
    // Keep array at max size
    if (this.speeds.length > this.maxHistory) {
      this.speeds.shift()
      this.avgSpeedTotal = getAverageSpeedTotal(this.speeds)
    }

    // Calculate speed and acceleration if we have enough data points
    // if (this.positionHistory.length >= 2) {
    //   this.manageSpeed && this.calculateSpeed()
    //   this.manageDirection && this.calculateDirection()
    // }
    //
    // if (this.manageAcceleration && this.positionHistory.length >= 3) {
    //   this.calculateAcceleration()
    // }

    // Save last processed values for next calculation
    this.lastPosition = { ...this.position }
    this.lastRawPosition = this.rawPosition
    this.lastTimestamp = timestamp
    this.lastSpeed = { ...this.speed }
  }

  processPosition(rawPosition) {
    // If this is the first position, just return raw position
    if (!this.lastPosition || !this.lastRawPosition || !this.lastTimestamp)
      return rawPosition

    if (
      this.options.freezeOnJolt?.enabled &&
      !this.pointerPinned &&
      !this.pointerFrozen &&
      this.speed.total >
        max(this.avgSpeedTotal, this.options.freezeOnJolt.minSpeedValue) *
          this.options.freezeOnJolt.factor
    ) {
      this.pinPointer()
      return this.lastPosition
    }

    if (this.options.freezeOnShake?.enabled) {
      if (this.detectShake()) {
        this.pinPointer()
        return this.lastPosition
      }
    }

    // Calculate position delta
    const deltaX = rawPosition.x - this.lastPosition.x
    const deltaY = rawPosition.y - this.lastPosition.y

    const distance = sqrt(pow(deltaX, 2) + pow(deltaY, 2))

    if (distance < 0.1) return rawPosition // Small threshold to stop when extremely close

    // Approach 1: Consistent interpolation with minimum speed
    const easeAmount = Math.max(
      this.options.ease,
      this.options.minSpeed / distance,
    )

    // Calculate the movement for this frame
    let cappedDeltaX = deltaX * easeAmount
    let cappedDeltaY = deltaY * easeAmount

    // Approach 2: Apply speed limit while maintaining direction
    const currentSpeed = Math.sqrt(
      cappedDeltaX * cappedDeltaX + cappedDeltaY * cappedDeltaY,
    )
    if (currentSpeed > this.options.maxSpeed) {
      const ratio = this.options.maxSpeed / currentSpeed
      cappedDeltaX *= ratio
      cappedDeltaY *= ratio
    }

    return {
      x: this.lastPosition.x + cappedDeltaX,
      y: this.lastPosition.y + cappedDeltaY,
    }
  }

  detectShake() {
    if (
      this.pointerFrozen ||
      this.speed.total <= this.options.freezeOnShake.minSpeed
    ) {
      this.resetShake()
      return
    }

    const directionX =
      this.speed.x > 0 ? 'right' : this.speed.x < 0 ? 'left' : null
    const directionY =
      this.speed.y > 0 ? 'down' : this.speed.y < 0 ? 'up' : null

    if (
      this.lastShakeDirectionX &&
      directionX &&
      directionX !== this.lastShakeDirectionX
    ) {
      this.shakeDirectionXChangeCount++
      this.refreshShakeDirChangeTimeout()
    }
    if (
      this.lastShakeDirectionY &&
      directionY &&
      directionY !== this.lastShakeDirectionY
    ) {
      this.shakeDirectionYChangeCount++
      this.refreshShakeDirChangeTimeout()
    }

    // this.reinitShakeTimeout()

    this.lastShakeDirectionX = directionX
    this.lastShakeDirectionY = directionY

    // Check if we've reached the threshold for a shake
    if (
      (this.shakeDirectionXChangeCount >=
        this.options.freezeOnShake.minShakes ||
        this.shakeDirectionYChangeCount >=
          this.options.freezeOnShake.minShakes) &&
      !this.shakeCooldownActive
    ) {
      // Trigger shake event
      this.dispatchEvent(
        new PointerShakeEvent({
          pointer: this.pointer,
          speed: this.speed.total,
          directionXChanges: this.shakeDirectionXChangeCount,
          directionYChanges: this.shakeDirectionYChangeCount,
        }),
      )

      // Reset
      this.resetShake()

      // Set cooldown
      this.shakeCooldownActive = true
      setTimeout(() => {
        this.shakeCooldownActive = false
      }, this.options.freezeOnShake.cooldown)

      console.log('shook')
      return true
    }
  }

  resetShake() {
    this.shakeDirectionXChangeCount = 0
    this.shakeDirectionYChangeCount = 0
    this.lastShakeDirectionX = null
    this.lastShakeDirectionX = null
  }

  clearShakeDirChangeTimeout() {
    if (this.shakeDirChangeTimeout) {
      clearTimeout(this.shakeDirChangeTimeout)
    }
  }

  refreshShakeDirChangeTimeout() {
    this.clearShakeDirChangeTimeout()
    this.shakeDirChangeTimeout = setTimeout(() => {
      this.resetShake()
    }, this.options.freezeOnShake.dirChangeTimeout)
  }

  focusCell(cellOrCellIndex) {
    const cellIndex =
      typeof cellOrCellIndex === 'number'
        ? cellOrCellIndex
        : cellOrCellIndex.index
    if (this.cells.focusedIndex !== cellIndex) {
      this.cells.focusedIndex = cellIndex
      this.dispatchEvent(new CellFocusedEvent(this.cells.focused, this.cells))
    }
  }

  getCellIndices(position, cb) {
    this.display.getPositionCellIndices(position).then((indices) => {
      const primaryIndex = indices?.[0]
      if (primaryIndex === undefined) {
        this.onPointerOut()
        return false
      }
      cb(primaryIndex, indices)
    })
  }

  getAutoFocusCenter(randomized = false) {
    const { width, height } = this.dimensions.get()
    return {
      x: width / 2 + (randomized ? (0.5 - random()) * 0.05 * width : 0),
      y: height / 2 + (randomized ? (0.5 - random()) * 0.05 * height : 0),
    }
  }

  handleAutoFocusUpdate() {
    if (this.cells.focused) {
      this.update = this.handleUpdate
    } else {
      this.assignPointer(
        this.getAutoFocusCenter(this.config.autoFocusCenter?.random),
      )
    }

    this.handleUpdate()
  }

  assignPointer(data) {
    Object.assign(this.pointer, data)
  }

  savePointer() {
    return {
      indices: this.pointer.indices,
      x: this.pointer.x,
      y: this.pointer.y,
      speedScale: 0,
    }
  }

  freezePointer() {
    this.pointerFrozen = true
    this.pointer.speedScale = 0
    this.frozenPointer ??= this.savePointer()

    this.dispatchEvent(
      new PointerFrozenChangeEvent({
        pointer: this.pointer,
        frozen: this.pointerFrozen,
      }),
    )
    // console.log('freezePointer')
  }

  unfreezePointer() {
    this.pointerFrozen = false
    this.frozenPointer = null

    this.dispatchEvent(
      new PointerFrozenChangeEvent({
        pointer: this.pointer,
        frozen: this.pointerFrozen,
      }),
    )
    // console.log('unfreezePointer')
  }

  pinPointer() {
    this.speed.total = 0
    this.pointerPinned = true
    this.pinnedPointer ??= this.savePointer()
    // console.log('pinPointer')
  }

  unpinPointer() {
    this.pointerPinned = false
    this.pinnedPointer = undefined
  }

  onPointerDown(e) {
    this.pointer.down = true
  }

  onPointerUp(e) {
    this.assignPointer({
      down: false,
    })
    this.handlePointerClick()
  }

  onPointerMove(e) {
    this.rawPosition = {
      x: e.x,
      y: e.y,
    }
  }

  onPointerOut(event) {
    this.handlePointerOut()
  }

  handlePointerOut() {
    if (this.cells.focused) {
      this.freezePointer()
    }
    this.position = undefined
  }

  handlePointerClick() {
    if (this.pointerFrozen) {
      // Object.assign(this.pointer, this.frozenPointer)
      this.unfreezePointer()
    } else {
      this.cells.selectedIndex =
        this.cells.selectedIndex !== this.cells.focusedIndex
          ? this.cells.focusedIndex
          : undefined

      this.dispatchEvent(new CellSelectedEvent(this.cells.selected))
    }
  }

  deselect() {
    this.cells.selectedIndex = undefined
    this.dispatchEvent(new CellSelectedEvent(undefined))
  }

  handlePointerMove() {
    this.dispatchEvent(new PointerMoveEvent(this.pointer))
  }

  initEventListeners() {
    window.addEventListener('blur', this.onPointerOut.bind(this))

    this.container.addEventListener(
      'pointerdown',
      this.onPointerDown.bind(this),
    )
    this.container.addEventListener('pointerup', this.onPointerUp.bind(this))

    if (isTouchDevice) {
    } else {
      this.container.addEventListener(
        'pointermove',
        this.onPointerMove.bind(this),
      )
      this.container.addEventListener(
        'pointerout',
        this.onPointerOut.bind(this),
      )
    }
  }

  removeEventListeners() {
    window.removeEventListener('blur', this.onPointerOut)

    if (isTouchDevice) {
    } else {
      this.container.removeEventListener('pointermove', this.onPointerMove)
      this.container.removeEventListener('pointerout', this.onPointerOut)
    }

    this.container.removeEventListener('pointerdown', this.onPointerDown)
    this.container.removeEventListener('pointerup', this.onPointerUp)
  }

  resize(dimensions) {
    // this.maxSpeed = this.config.maxPointerSpeed * dimensions.diagonal
    if (this.cells.focused) {
      this.freezePointer()
      this.assignPointer({
        x: this.cells.focused.x,
        y: this.cells.focused.y,
      })
      this.dispatchEvent(new CellFocusedEvent(this.cells.focused, this.cells))
    }
  }

  dispose() {
    this.removeEventListeners()
  }
}
