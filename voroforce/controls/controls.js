import { isTouchDevice } from '../utils'
import { CustomEventTarget } from '../utils/custom-event-target'
import {
  CellFocusedEvent,
  CellSelectedEvent,
  PointerFrozenChangeEvent,
  PointerShakeEvent,
} from './controls-events'

const { pow, sqrt, random, min, max } = Math

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
    this.reset()
  }

  reset() {
    this.positionHistory = []
    this.speeds = []
    this.rawSpeeds = []
    this.position = null
    this.rawPosition = null
    this.lastPosition = null
    this.lastRawPosition = null
    this.speed = { x: 0, y: 0, total: 0 }
    this.rawSpeed = { x: 0, y: 0, total: 0 }
    this.lastSpeed = { x: 0, y: 0, total: 0 }
    this.lastRawSpeed = { x: 0, y: 0, total: 0 }
    this.avgRawSpeedTotal = 0
    this.avgSpeedTotal = 0
    this.acceleration = { x: 0, y: 0, total: 0 }
    this.direction = 0
    this.lastTimestamp = null
  }

  initGlobals(store, display) {
    this.store = store
    this.store.set('controls', this)
    this.globalConfig = this.store.get('config')
    this.config = this.globalConfig.controls
    if (
      this.config.autoFocusCenter?.enabled &&
      (this.config.autoFocusCenter.enabled !== 'touch' || isTouchDevice)
    )
      this.update = this.handleAutoFocusUpdate

    this.display = display
  }

  initProperties() {
    this.container = this.store.get('container')
    this.dimensions = this.store.get('dimensions')
    this.pointer = this.store.get('sharedPointer')
    this.cells = this.store.get('cells')

    this.maxHistory = 10 // Number of prev items to store for calculations
  }

  handleConfig() {
    this.options = {
      raw: this.config.raw || false,

      maxSpeed: this.config.maxSpeed || 10,
      minSpeed: this.config.minSpeed || 2,
      ease: this.config.ease || 0.15,

      freezeOnJolt: {
        enabled: this.config.freezeOnJolt?.enabled || false,
        factor: this.config.freezeOnJolt?.factor || 10,
        minSpeedValue: this.config.freezeOnJolt?.minSpeedValue || 2,
      },

      unfreezePointerSpeedLimit: this.config.unfreezePointerSpeedLimit || 5,

      selectSpeedLimit: this.config.selectSpeedLimit || 2,

      freezeOnShake: {
        enabled: this.config.freezeOnShake?.enabled || false,
        minSpeed: this.config.freezeOnShake?.minSpeed || 2, // Minimum velocity to count as a shake
        dirChangeTimeout: this.config.freezeOnShake?.dirChangeTimeout || 250, // Reset after this many ms of no dir change
        minShakes: this.config.freezeOnShake?.minShakes || 3, // Minimum direction changes to trigger a shake
        cooldown: this.config.freezeOnShake?.cooldown || 2000, // Minimum time between shake events
      },
    }
  }

  updateConfig(config) {
    this.config = config
    this.globalConfig.controls = config
    this.handleConfig()
  }

  handleUpdate() {
    if (this.pointerFrozen) {
      this.getCellIndices(this.pointer, (primaryIndex, indices) => {
        this.assignPointer({
          indices,
        })
        this.focusCell(primaryIndex)
      })
    }

    this.handleRawPosition()

    if (!this.position) return

    if (this.pointerFrozen) {
      if (this.avgSpeedTotal < this.options.unfreezePointerSpeedLimit) {
        this.getCellIndices(this.rawPosition, (primaryIndex) => {
          if (this.cells.focusedIndex === primaryIndex) {
            this.unfreezePointer()
          }
        })
      }
    } else {
      this.assignPointer({
        x: this.position.x,
        y: this.position.y,
        speedScale: this.avgSpeedTotal / this.options.maxSpeed,
      })

      this.getCellIndices(this.position, (primaryIndex, indices) => {
        if (this.pointerPinned && this.cells.focusedIndex !== primaryIndex) {
          // this.assignPointer(this.pinnedPointer)
          this.freezePointer()
        } else {
          this.assignPointer({
            indices,
          })
          this.focusCell(primaryIndex)
        }
      })
    }
  }

  handleRawPosition() {
    if (!this.rawPosition) return

    this.assignPointer({
      rawX: this.rawPosition.x,
      rawY: this.rawPosition.y,
    })

    // Process the position with capping if needed
    this.position = this.processPosition(this.rawPosition)

    this.positionHistory.push(this.position)
    // Keep array at max size
    if (this.positionHistory.length > this.maxHistory) {
      this.positionHistory.shift()
    }

    this.speeds.push({
      ...this.speed,
    })
    // Keep array at max size
    if (this.speeds.length > this.maxHistory) {
      this.speeds.shift()
      this.avgSpeedTotal = getAverageSpeedTotal(this.speeds)
    }

    this.rawSpeeds.push({
      ...this.rawSpeed,
    })
    // Keep array at max size
    if (this.rawSpeeds.length > this.maxHistory) {
      this.rawSpeeds.shift()
      this.avgRawSpeedTotal = getAverageSpeedTotal(this.rawSpeeds)
    }

    // Save last processed values for next calculation
    this.lastPosition = { ...this.position }
    this.lastRawPosition = { ...this.rawPosition }
    this.lastSpeed = { ...this.speed }
    this.lastRawSpeed = { ...this.rawSpeed }
  }

  processPosition(rawPosition) {
    // If this is the first position, just return raw position
    if (!this.lastPosition || !this.lastRawPosition) return rawPosition

    // raw speed
    this.rawSpeed.x = rawPosition.x - this.lastRawPosition.x
    this.rawSpeed.y = rawPosition.y - this.lastRawPosition.y
    this.rawSpeed.total = sqrt(
      pow(this.rawSpeed.x, 2) + pow(this.rawSpeed.y, 2),
    )

    if (this.options.raw) {
      this.speed = this.rawSpeed
      return rawPosition
    }

    if (this.detectJolt() || this.detectShake()) {
      this.pinPointer()
      return this.lastPosition
    }

    if (this.pointerFrozen) {
      this.speed.x = 0
      this.speed.y = 0
      this.speed.total = 0
      return rawPosition
    }

    // Calculate position delta
    const deltaX = rawPosition.x - this.lastPosition.x
    const deltaY = rawPosition.y - this.lastPosition.y

    const distance = sqrt(pow(deltaX, 2) + pow(deltaY, 2))

    // Small threshold to stop when extremely close
    if (distance < 0.1) {
      this.speed.x = 0
      this.speed.y = 0
      this.speed.total = 0
      return rawPosition
    }

    // Consistent interpolation with minimum speed
    // const easeAmount = Math.max(
    //   this.options.ease,
    //   this.options.minSpeed / distance,
    // )
    const easeAmount = this.options.ease

    // Calculate the movement for this frame
    let cappedDeltaX = deltaX * easeAmount
    let cappedDeltaY = deltaY * easeAmount

    let speed = sqrt(cappedDeltaX * cappedDeltaX + cappedDeltaY * cappedDeltaY)

    // Apply speed limit while maintaining direction
    if (speed > this.options.maxSpeed) {
      const ratio = this.options.maxSpeed / speed
      cappedDeltaX *= ratio
      cappedDeltaY *= ratio
      speed = this.options.maxSpeed
    }

    this.speed.x = cappedDeltaX
    this.speed.y = cappedDeltaY
    this.speed.total = speed

    return {
      x: this.lastPosition.x + cappedDeltaX,
      y: this.lastPosition.y + cappedDeltaY,
    }
  }

  detectJolt() {
    if (!this.options.freezeOnJolt?.enabled) return
    if (this.pointerPinned || this.pointerFrozen) return

    return (
      this.rawSpeed.total >
      max(this.avgRawSpeedTotal, this.options.freezeOnJolt.minSpeedValue) *
        this.options.freezeOnJolt.factor
    )
  }

  detectShake() {
    if (!this.options.freezeOnShake?.enabled) return

    if (
      this.pointerFrozen ||
      this.rawSpeed.total <= this.options.freezeOnShake.minSpeed
    ) {
      this.resetShake()
      return
    }

    const directionX =
      this.rawSpeed.x > 0 ? 'right' : this.rawSpeed.x < 0 ? 'left' : null
    const directionY =
      this.rawSpeed.y > 0 ? 'down' : this.rawSpeed.y < 0 ? 'up' : null

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
          speed: this.rawSpeed.total,
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

  freezePointer(frozenPointer) {
    if (this.pointerPinned) {
      this.unpinPointer()
    }
    this.pointerFrozen = true
    this.pointer.speedScale = 0
    this.frozenPointer ??= frozenPointer ?? this.savePointer()

    this.dispatchEvent(
      new PointerFrozenChangeEvent({
        pointer: this.pointer,
        frozen: this.pointerFrozen,
      }),
    )
  }

  unfreezePointer() {
    this.pointerFrozen = false
    if (this.frozenPointer) {
      this.lastPosition = {
        x: this.frozenPointer.x,
        y: this.frozenPointer.y,
      }
    }
    this.frozenPointer = null

    this.dispatchEvent(
      new PointerFrozenChangeEvent({
        pointer: this.pointer,
        frozen: this.pointerFrozen,
      }),
    )
  }

  pinPointer() {
    this.speed.total = 0
    this.pointerPinned = true
    this.pinnedPointer ??= this.savePointer()
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
    this.reset()
  }

  handlePointerClick() {
    if (this.pointerFrozen) {
      // Object.assign(this.pointer, this.frozenPointer)
      this.unfreezePointer()
    } else {
      // if (this.speed.total < this.options.selectSpeedLimit) {
      this.cells.selectedIndex =
        this.cells.selectedIndex !== this.cells.focusedIndex
          ? this.cells.focusedIndex
          : undefined

      this.dispatchEvent(new CellSelectedEvent(this.cells.selected))
      // }
    }
  }

  deselect() {
    this.cells.selectedIndex = undefined
    this.dispatchEvent(new CellSelectedEvent(undefined))
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

  startResize(dimensions) {
    if (!this.cells.focused) return
    this.freezePointer()
  }

  endResize(dimensions) {
    if (!this.cells.focused) return
    this.assignPointer({
      x: this.cells.focused.x,
      y: this.cells.focused.y,
    })
    this.dispatchEvent(new CellFocusedEvent(this.cells.focused, this.cells))
  }

  resize(dimensions) {
    this.startResize()
    this.endResize()
  }

  dispose() {
    this.removeEventListeners()
  }
}
