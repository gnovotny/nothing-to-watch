import { isTouchDevice } from '../utils'
import { CustomEventTarget } from '../utils/custom-event-target'

// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional
const Infinity = Number.POSITIVE_INFINITY

const { abs, atan2, pow, sqrt, random, min, max, PI } = Math

class PointerMoveEvent extends Event {
  constructor(pointer) {
    super('pointerMove')
    this.pointer = pointer
  }
}

class PointerShakeEvent extends Event {
  constructor(data) {
    super('pointerShake')
    Object.assign(this, data)
  }
}

class PointerFrozenChangeEvent extends Event {
  constructor(data) {
    super('pointerFrozenChange')
    Object.assign(this, data)
  }
}

class CellFocusedEvent extends Event {
  constructor(cell, cells) {
    super('focused')
    this.cell = cell
    this.cells = cells
  }
}

class CellSelectedEvent extends Event {
  constructor(cell, cells) {
    super('selected')
    this.cell = cell
    this.cells = cells
  }
}

const getAverageSpeedTotal = (array) =>
  array.reduce((a, b) => a + b.total, 0) / array.length

export default class Controls extends CustomEventTarget {
  pointerFrozen = true

  constructor(store, display, options = {}) {
    super()
    this.initGlobals(store, display)
    this.initProperties()
    this.initEventListeners()

    // Configuration options with defaults
    // this.options = {
    //   maxSpeed: options.maxSpeed !== undefined ? options.maxSpeed : Infinity, // Maximum speed threshold in px/s
    //   maxAcceleration:
    //     options.maxAcceleration !== undefined
    //       ? options.maxAcceleration
    //       : Infinity, // Maximum acceleration threshold in px/s²
    //   capValues: options.capValues || false, // Whether to cap values at the threshold
    //   ...options,
    // }

    this.options = {
      maxSpeed: 300,
      maxAcceleration: 50000,
      capValues: false,

      freezeOnAbruptSpeedIncreaseFactor: 10,
      unfreezePointerSpeedLimit: 300,

      shakeEnabled: options.shakeEnabled || true,
      shakeMinSpeed: options.shakeMinSpeed || 200, // Minimum velocity to count as a shake
      shakeDirChangeTimeout: options.shakeDirChangeTimeout || 100, // Reset after this many ms of no dir change
      minShakes: options.minShakes || 4, // Minimum direction changes to trigger a shake
      shakeCooldown: options.shakeCooldown || 2000, // Minimum time between shake events
    }

    // Store previous positions and timestamps
    this.positionHistory = []
    this.speeds = []
    this.maxHistory = 10 // Number of prev items to store for calculations

    // Current values
    // this.position = { x: 0, y: 0 }
    this.lastPosition = null // Last adjusted position
    this.speed = { x: 0, y: 0, total: 0 }
    this.lastSpeed = { x: 0, y: 0, total: 0 } // Last adjusted speed
    this.avgSpeedTotal = 0
    this.acceleration = { x: 0, y: 0, total: 0 }
    this.direction = 0

    // Flags for threshold detection

    // Last timestamp for controlling position updates
    this.lastTimestamp = null

    this.update = this.handleFirstUpdate
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

    // const d = this.dimensions.get('diagonal')
    // this.maxSpeed = this.config.maxPointerSpeed
    //   ? this.config.maxPointerSpeed * d
    //   : Infinity
    // this.maxAcceleration = this.config.maxPointerAcceleration
    //   ? this.config.maxPointerAcceleration * d
    //   : Infinity
  }

  handleFirstUpdate() {
    if (
      this.cells.focused ||
      !this.config.autoFocusCenter?.enabled ||
      (this.config.autoFocusCenter.enabled === 'touch' && !isTouchDevice)
    ) {
      this.update = this.handleUpdate
      return
    }

    const width = this.dimensions.get('width')
    const height = this.dimensions.get('height')
    Object.assign(this.pointer, {
      x:
        width / 2 +
        (this.config.autoFocusCenter.random
          ? (0.5 - random()) * 0.05 * width
          : 0),
      y:
        height / 2 +
        (this.config.autoFocusCenter.random
          ? (0.5 - random()) * 0.05 * height
          : 0),
    })
    this.handleUpdate()
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

  handleUpdate(/*position = this.position*/) {
    if (this.pointerFrozen) {
      this.getCellIndices(this.pointer, (primaryIndex, indices) => {
        Object.assign(this.pointer, {
          indices,
        })

        if (this.cells.focusedIndex !== primaryIndex) {
          this.cells.focusedIndex = primaryIndex
          this.dispatchEvent(
            new CellFocusedEvent(this.cells.focused, this.cells),
          )
        }
      })
    }

    if (this.rawPosition) {
      this.handlePointerPosition({
        ...this.rawPosition,
        timestamp: performance.now(),
      })
    }

    if (!this.position) return

    if (!this.pointerFrozen) {
      this.pointer.speedScale =
        Math.min(this.speed.total, this.options.maxSpeed) /
        this.options.maxSpeed
      Object.assign(this.pointer, this.position)
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
          Object.assign(this.pointer, this.pinnedPointer)
          this.unpinPointer()
          this.freezePointer()
        } else {
          Object.assign(this.pointer, {
            indices,
          })
          if (this.cells.focusedIndex !== primaryIndex) {
            this.cells.focusedIndex = primaryIndex
            this.dispatchEvent(
              new CellFocusedEvent(this.cells.focused, this.cells),
            )
          }
        }
      }
    })
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
    Object.assign(this.pointer, {
      down: false,
    })
    this.handlePointerClick()
  }

  handlePointerPosition(rawPosition) {
    if (!rawPosition) return

    // Process the position with capping if needed
    const position = this.processPosition(rawPosition)

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
    this.lastTimestamp = rawPosition.timestamp
    this.lastSpeed = { ...this.speed }
    this.lastAcceleration = { ...this.acceleration }
  }

  onPointerMove(e) {
    this.rawPosition = {
      x: e.x,
      y: e.y,
      timestamp: performance.now(),
    }
  }

  processPosition(rawPosition) {
    // If this is the first position, just return raw position
    if (!this.lastPosition || !this.lastTimestamp) return rawPosition

    // Calculate time delta in seconds
    const timeDelta = (rawPosition.timestamp - this.lastTimestamp) / 1000
    if (timeDelta <= 0) return rawPosition // Safety check

    // Calculate desired position based on raw mouse coordinates
    const positionDeltaX = rawPosition.x - this.lastPosition.x
    const positionDeltaY = rawPosition.y - this.lastPosition.y

    // Calculate the desired speed
    this.speed.x = positionDeltaX / timeDelta
    this.speed.y = positionDeltaY / timeDelta
    this.speed.total = sqrt(pow(this.speed.x, 2) + pow(this.speed.y, 2))

    if (this.options.shakeEnabled) {
      const shook = this.handleShake()
      if (shook) {
        this.pinPointer()
        return this.lastPosition
      }
    }

    if (
      this.options.freezeOnAbruptSpeedIncreaseFactor &&
      this.speed.total >
        max(this.avgSpeedTotal, 100) *
          this.options.freezeOnAbruptSpeedIncreaseFactor &&
      !this.pointerPinned &&
      !this.pointerFrozen
    ) {
      this.pinPointer()
      return this.lastPosition
    }

    // If speed is within limits, no capping needed
    if (!this.options.capValues || this.speed.total <= this.options.maxSpeed) {
      return rawPosition
    }

    // Cap the speed and calculate new position delta
    const speedFactor = this.options.maxSpeed / this.speed.total
    const cappedPositionDeltaX = positionDeltaX * speedFactor
    const cappedPositionDeltaY = positionDeltaY * speedFactor

    // Calculate the new position based on capped speed
    const cappedPosition = {
      x: this.lastPosition.x + cappedPositionDeltaX,
      y: this.lastPosition.y + cappedPositionDeltaY,
      timestamp: rawPosition.timestamp,
    }

    // Check acceleration cap if we have previous speed data
    if (this.options.maxAcceleration < Infinity && this.lastSpeed) {
      // Calculate desired acceleration
      const desiredAccelX = (this.speed.x - this.lastSpeed.x) / timeDelta
      const desiredAccelY = (this.speed.y - this.lastSpeed.y) / timeDelta
      const desiredAccelTotal = sqrt(
        desiredAccelX * desiredAccelX + desiredAccelY * desiredAccelY,
      )

      // If acceleration is over limit, cap it
      if (desiredAccelTotal > this.options.maxAcceleration) {
        const accelFactor = this.options.maxAcceleration / desiredAccelTotal

        // Calculate new speed based on capped acceleration
        const cappedSpeedX =
          this.lastSpeed.x + (this.speed.x - this.lastSpeed.x) * accelFactor
        const cappedSpeedY =
          this.lastSpeed.y + (this.speed.y - this.lastSpeed.y) * accelFactor

        // Calculate new position based on capped acceleration
        cappedPosition.x = this.lastPosition.x + cappedSpeedX * timeDelta
        cappedPosition.y = this.lastPosition.y + cappedSpeedY * timeDelta
      }
    }

    return cappedPosition
  }

  // calculateSpeed() {
  //   // Use the two most recent positions
  //   const current = this.positionHistory[this.positionHistory.length - 1]
  //   const previous = this.positionHistory[this.positionHistory.length - 2]
  //
  //   // Time difference in seconds
  //   const timeDiff = (current.timestamp - previous.timestamp) / 1000
  //
  //   if (timeDiff > 0) {
  //     // Calculate speed components (pixels per second)
  //     this.speed.x = (current.x - previous.x) / timeDiff
  //     this.speed.y = (current.y - previous.y) / timeDiff
  //
  //     // Calculate total speed (magnitude of velocity vector)
  //     this.speed.total = sqrt(pow(this.speed.x, 2) + pow(this.speed.y, 2))
  //
  //     // Apply maximum speed threshold if specified
  //     if (this.options.maxSpeed < Infinity) {
  //       // Check if we're over the threshold
  //       const isOverSpeedThreshold = this.speed.total > this.options.maxSpeed
  //
  //       // Optionally cap the speed at the maximum value
  //       if (this.options.capValues && isOverSpeedThreshold) {
  //         const factor = this.options.maxSpeed / this.speed.total
  //         this.speed.x *= factor
  //         this.speed.y *= factor
  //         this.speed.total = this.options.maxSpeed
  //       }
  //     }
  //   }
  // }
  //
  // calculateDirection() {
  //   // Calculate direction in degrees (0 = right, 90 = down, 180 = left, 270 = up)
  //   if (abs(this.speed.x) > 0.1 || abs(this.speed.y) > 0.1) {
  //     this.direction = atan2(this.speed.y, this.speed.x) * (180 / PI)
  //     // Convert to 0-360 range
  //     if (this.direction < 0) {
  //       this.direction += 360
  //     }
  //   }
  // }
  //
  // calculateAcceleration() {
  //   // We need at least 3 positions to calculate acceleration
  //   const current = this.positionHistory[this.positionHistory.length - 1]
  //   const middle = this.positionHistory[this.positionHistory.length - 2]
  //   const oldest = this.positionHistory[this.positionHistory.length - 3]
  //
  //   // Time differences in seconds
  //   const timeDiff1 = (middle.timestamp - oldest.timestamp) / 1000
  //   const timeDiff2 = (current.timestamp - middle.timestamp) / 1000
  //
  //   if (timeDiff1 > 0 && timeDiff2 > 0) {
  //     // Calculate speed at two points in time
  //     const speed1 = {
  //       x: (middle.x - oldest.x) / timeDiff1,
  //       y: (middle.y - oldest.y) / timeDiff1,
  //     }
  //
  //     const speed2 = {
  //       x: (current.x - middle.x) / timeDiff2,
  //       y: (current.y - middle.y) / timeDiff2,
  //     }
  //
  //     // Calculate acceleration (change in speed over time)
  //     const timeDiffTotal = timeDiff1 + timeDiff2
  //
  //     if (timeDiffTotal > 0) {
  //       this.acceleration.x = (speed2.x - speed1.x) / timeDiffTotal
  //       this.acceleration.y = (speed2.y - speed1.y) / timeDiffTotal
  //
  //       // Calculate total acceleration (magnitude)
  //       this.acceleration.total = sqrt(
  //         pow(this.acceleration.x, 2) + pow(this.acceleration.y, 2),
  //       )
  //
  //       // Apply maximum acceleration threshold if specified
  //       if (this.options.maxAcceleration < Infinity) {
  //         // Check if we're over the threshold
  //         const isOverAccelerationThreshold =
  //           this.acceleration.total > this.options.maxAcceleration
  //
  //         // Optionally cap the acceleration at the maximum value
  //         if (this.options.capValues && isOverAccelerationThreshold) {
  //           const factor =
  //             this.options.maxAcceleration / this.acceleration.total
  //           this.acceleration.x *= factor
  //           this.acceleration.y *= factor
  //           this.acceleration.total = this.options.maxAcceleration
  //         }
  //       }
  //     }
  //   }
  // }

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
    }, this.options.shakeDirChangeTimeout)
  }

  handleShake() {
    if (this.pointerFrozen || this.speed.total <= this.options.shakeMinSpeed) {
      this.resetShake()
      return
    }

    const directionX = this.speed.x > 0 ? 'right' : 'left'
    const directionY = this.speed.y > 0 ? 'down' : 'up'

    if (this.lastShakeDirectionX && directionX !== this.lastShakeDirectionX) {
      this.shakeDirectionXChangeCount++
      this.refreshShakeDirChangeTimeout()
    }
    if (this.lastShakeDirectionY && directionY !== this.lastShakeDirectionY) {
      this.shakeDirectionYChangeCount++
      this.refreshShakeDirChangeTimeout()
    }

    // this.reinitShakeTimeout()

    this.lastShakeDirectionX = directionX
    this.lastShakeDirectionY = directionY

    // Check if we've reached the threshold for a shake
    if (
      (this.shakeDirectionXChangeCount >= this.options.minShakes ||
        this.shakeDirectionYChangeCount >= this.options.minShakes) &&
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
      }, this.options.shakeCooldown)

      console.log('shook')
      return true
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
    this.cells.selectedIndex =
      this.cells.selectedIndex !== this.cells.focusedIndex
        ? this.cells.focusedIndex
        : undefined

    this.dispatchEvent(new CellSelectedEvent(this.cells.selected))
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
      Object.assign(this.pointer, {
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
